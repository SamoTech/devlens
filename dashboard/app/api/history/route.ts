import { NextRequest, NextResponse } from 'next/server'
import { analyzeRepo } from '@/lib/scorer'
import { auth } from '@/lib/auth'
import { getRedis } from '@/lib/redis'

export async function GET(req: NextRequest) {
  const searchParams = new URL(req.url).searchParams
  const repo = searchParams.get('repo')
  if (!repo) return NextResponse.json({ error: 'repo param required' }, { status: 400 })

  const [owner, name] = repo.split('/')
  const redis = getRedis()

  try {
    const session = await auth()
    const token = (session as any)?.accessToken ?? process.env.GITHUB_TOKEN
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

    // Fallback if no real history yet
    if (history.length === 0) {
      history = [{ week: 'Now', score: current.healthScore, date: new Date().toISOString() }]
    }

    return NextResponse.json({ current, history })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'History failed' }, { status: 500 })
  }
}
