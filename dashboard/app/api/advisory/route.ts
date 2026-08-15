/**
 * GET /api/advisory?repo=owner/name
 *
 * Returns a full AdvisoryReport: installed packages cross-referenced
 * against GitHub Advisory DB, Dependabot Alerts, and OSV.dev.
 * Cached in Redis for 30 minutes (advisories don't change by the minute).
 */
import { NextRequest, NextResponse } from 'next/server'
import { runAdvisoryCheck }          from '@/lib/advisory'
import { auth }                       from '@/lib/auth'
import { Redis }                      from '@upstash/redis'
import { parseRepoSlug }               from '@/lib/repo-validation.mjs'
import { consumeRateLimit, requestIdentity } from '@/lib/rate-limit.mjs'

export const dynamic = 'force-dynamic'

const redis = Redis.fromEnv()

export async function GET(req: NextRequest) {
  const repo = new URL(req.url).searchParams.get('repo')
  const parsedRepo = parseRepoSlug(repo)
  if (!parsedRepo) return NextResponse.json({ error: 'Invalid repo format. Use owner/name or an https://github.com/owner/name URL' }, { status: 400 })

  const { owner, name } = parsedRepo
  const cacheKey      = `advisory:${owner}:${name}`

  // ── Try cache first ──
  try {
    const cached = await redis.get<string>(cacheKey)
    if (cached) {
      const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached
      return NextResponse.json({ ...parsed, cached: true }, {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      })
    }
  } catch {}

  // ── Run scan ──
  try {
    const session = await auth()
    const token   = (session as any)?.accessToken ?? process.env.GITHUB_TOKEN
    const limit = await consumeRateLimit(redis, requestIdentity(req, (session as any)?.user?.email), 'advisory')
    if (!limit.allowed) return NextResponse.json({ error: 'rate_limited', message: 'Advisory scan rate limit exceeded. Try again shortly.' }, { status: 429, headers: limit.headers })

    const report = await runAdvisoryCheck(owner, name, token)

    // Cache 30 min
    try { await redis.set(cacheKey, JSON.stringify(report), { ex: 1800 }) } catch {}

    return NextResponse.json(report, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? 'Advisory scan failed' },
      { status: 500 }
    )
  }
}
