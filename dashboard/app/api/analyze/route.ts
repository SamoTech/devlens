import { NextRequest, NextResponse } from 'next/server'
import { analyzeRepo } from '@/lib/scorer'
import { auth } from '@/lib/auth'
import type { DimKey } from '@/lib/constants'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export async function GET(req: NextRequest) {
  const searchParams = new URL(req.url).searchParams
  const repo = searchParams.get('repo')
  const weightsParam = searchParams.get('weights')

  if (!repo) return NextResponse.json({ error: 'repo param required' }, { status: 400 })

  const parts = repo.replace('https://github.com/', '').replace(/\/$/, '').split('/')
  if (parts.length < 2) return NextResponse.json({ error: 'Invalid repo format. Use owner/name' }, { status: 400 })

  const [owner, name] = parts
  const slug = `${owner}/${name}`

  let customWeights: Partial<Record<DimKey, number>> | undefined
  if (weightsParam) {
    try { customWeights = JSON.parse(weightsParam) } catch {}
  }

  try {
    const session = await auth()
    const token = (session as any)?.accessToken ?? process.env.GITHUB_TOKEN
    const report = await analyzeRepo(owner, name, token, customWeights)

    // ── Track stats in Redis (fire-and-forget, never blocks the response) ──
    const today = new Date().toISOString().slice(0, 10)
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      'unknown'

    Promise.all([
      // Global counters
      redis.incr('stats:total_analyses'),
      redis.incr(`stats:daily:${today}`),
      // Per-repo hit count + last score + last seen
      redis.hincrby('stats:repo_hits', slug, 1),
      redis.hset('stats:repo_scores', { [slug]: report.score }),
      redis.hset('stats:repo_last_seen', { [slug]: new Date().toISOString() }),
      // Unique visitor IPs
      redis.sadd('stats:unique_ips', ip),
      // Watchlist (recently checked) — dedupe then prepend
      redis.lrange('devlens:watchlist', 0, 99).then(async (existing: any[]) => {
        for (const item of existing ?? []) {
          if (item?.slug === slug) await redis.lrem('devlens:watchlist', 0, item)
        }
        await redis.lpush('devlens:watchlist', {
          slug,
          score: report.score,
          description: (report as any).description ?? null,
          language: (report as any).language ?? null,
          savedAt: new Date().toISOString(),
        })
        await redis.ltrim('devlens:watchlist', 0, 99)
      }),
    ]).catch(() => {}) // never let tracking errors surface to the user
    // ─────────────────────────────────────────────────────────────────────

    return NextResponse.json(report)
  } catch (e: any) {
    if (e.code === 'rate_limited') {
      return NextResponse.json({ error: 'rate_limited', message: e.message }, { status: 429 })
    }
    return NextResponse.json({ error: e.message ?? 'Analysis failed' }, { status: 500 })
  }
}
