import { NextRequest, NextResponse } from 'next/server'
import { analyzeRepo } from '@/lib/scorer'
import { auth } from '@/lib/auth'
import { getRedis } from '@/lib/redis'
import { parseRepoSlug } from '@/lib/repo-validation.mjs'
import { consumeRateLimit, requestIdentity } from '@/lib/rate-limit.mjs'

export async function GET(req: NextRequest) {
  const searchParams = new URL(req.url).searchParams
  const repo = searchParams.get('repo')
  const parsedRepo = parseRepoSlug(repo)
  if (!parsedRepo) return NextResponse.json({ error: 'Invalid repo format. Use owner/name or an https://github.com/owner/name URL' }, { status: 400 })

  const { owner, name } = parsedRepo
  const redis = getRedis()

  try {
    const session = await auth()
    const token = (session as any)?.accessToken ?? process.env.GITHUB_TOKEN
    const limit = await consumeRateLimit(redis, requestIdentity(req, (session as any)?.user?.email), 'history')
    if (!limit.allowed) return NextResponse.json({ error: 'rate_limited', message: 'History rate limit exceeded. Try again shortly.' }, { status: 429, headers: limit.headers })

    const key = `history:${owner}:${name}`
    const current = await analyzeRepo(owner, name, token)

    let history: { week: string; score: number; date: string }[] = []

    if (redis) {
      try {
        const stored = await redis.get<any>(`history:${owner}:${name}`)
        if (stored) {
          history = typeof stored === 'string' ? JSON.parse(stored) : stored
        }
      } catch {}
    }

    if (history.length === 0) {
      history = [{ week: 'Now', score: current.healthScore, date: new Date().toISOString() }]
    }

    return NextResponse.json({ current, history })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'History failed' }, { status: 500 })
  }
}
