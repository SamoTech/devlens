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

export const dynamic = 'force-dynamic'

const redis = Redis.fromEnv()

export async function GET(req: NextRequest) {
  const repo = new URL(req.url).searchParams.get('repo')
  if (!repo) return NextResponse.json({ error: 'repo param required' }, { status: 400 })

  const parts = repo.replace('https://github.com/', '').replace(/\/$/, '').split('/')
  if (parts.length < 2) return NextResponse.json({ error: 'Invalid repo format' }, { status: 400 })

  const [owner, name] = parts
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
