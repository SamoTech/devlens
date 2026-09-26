import { NextRequest, NextResponse } from 'next/server'
import { analyzeRepo } from '@/lib/scorer'
import { auth } from '@/lib/auth'
import type { DimKey } from '@/lib/constants'
import { parseRepoSlug } from '@/lib/repo-validation.mjs'
import { consumeRateLimit, requestIdentity } from '@/lib/rate-limit.mjs'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export async function GET(req: NextRequest) {
  const searchParams = new URL(req.url).searchParams
  const repo = searchParams.get('repo')
  const weightsParam = searchParams.get('weights')

  const parsedRepo = parseRepoSlug(repo)
  if (!parsedRepo) return NextResponse.json({ error: 'Invalid repo format. Use owner/name or an https://github.com/owner/name URL' }, { status: 400 })

  const { owner, name, slug } = parsedRepo

  let customWeights: Partial<Record<DimKey, number>> | undefined
  if (weightsParam) {
    try {
      const parsedWeights = JSON.parse(weightsParam)
      if (!parsedWeights || typeof parsedWeights !== 'object' || Array.isArray(parsedWeights)) {
        return NextResponse.json({ error: 'weights must be a JSON object' }, { status: 400 })
      }
      customWeights = parsedWeights
    } catch {
      return NextResponse.json({ error: 'weights must be valid JSON' }, { status: 400 })
    }
  }

  try {
    const session = await auth()
    const token = (session as any)?.accessToken ?? process.env.GITHUB_TOKEN
    const limit = await consumeRateLimit(redis, requestIdentity(req, (session as any)?.user?.email), 'analyze')
    if (!limit.allowed) return NextResponse.json({ error: 'rate_limited', message: 'Analysis rate limit exceeded. Try again shortly.' }, { status: 429, headers: limit.headers })
    const report = await analyzeRepo(owner, name, token, customWeights)

    // ── Track stats in Redis (fire-and-forget) ──
    const today = new Date().toISOString().slice(0, 10)
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      'unknown'

    Promise.all([
      redis.incr('stats:total_analyses'),
      redis.incr(`stats:daily:${today}`),
      redis.hincrby('stats:repo_hits', slug, 1),
      redis.hset('stats:repo_scores', { [slug]: report.healthScore }),
      redis.hset('stats:repo_last_seen', { [slug]: new Date().toISOString() }),
      redis.sadd('stats:unique_ips', ip),
    ]).catch(() => {})
    // ─────────────────────────────────────

    return NextResponse.json(report)
  } catch (e: any) {
    if (e.code === 'rate_limited') {
      return NextResponse.json({ error: 'rate_limited', message: e.message }, { status: 429 })
    }
    if (e.code === 'not_found') {
      return NextResponse.json({ error: 'repository_not_found', message: 'Repository not found or inaccessible. Check the owner/name and make sure the repository is public.' }, { status: 404 })
    }
    if (e.code === 'private_repository') {
      return NextResponse.json({ error: 'private_repository', message: 'Private repositories are not supported.' }, { status: 403 })
    }
    console.error('analysis error', e)
    return NextResponse.json({ error: 'analysis_failed', message: 'Unable to analyze this repository right now. Please verify the repository and try again.' }, { status: 500 })
  }
}
