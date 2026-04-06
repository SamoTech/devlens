import { NextRequest, NextResponse } from 'next/server'
import { analyzeRepo } from '@/lib/scorer'
import { auth } from '@/lib/auth'
import type { DimKey } from '@/lib/constants'

export async function GET(req: NextRequest) {
  const searchParams = new URL(req.url).searchParams
  const repo = searchParams.get('repo')
  const weightsParam = searchParams.get('weights')

  if (!repo) return NextResponse.json({ error: 'repo param required' }, { status: 400 })

  const parts = repo.replace('https://github.com/', '').replace(/\/$/, '').split('/')
  if (parts.length < 2) return NextResponse.json({ error: 'Invalid repo format. Use owner/name' }, { status: 400 })

  const [owner, name] = parts

  let customWeights: Partial<Record<DimKey, number>> | undefined
  if (weightsParam) {
    try { customWeights = JSON.parse(weightsParam) } catch {}
  }

  try {
    const session = await auth()
    const token = (session as any)?.accessToken ?? process.env.GITHUB_TOKEN
    const report = await analyzeRepo(owner, name, token, customWeights)
    return NextResponse.json(report)
  } catch (e: any) {
    if (e.code === 'rate_limited') {
      return NextResponse.json({ error: 'rate_limited', message: e.message }, { status: 429 })
    }
    return NextResponse.json({ error: e.message ?? 'Analysis failed' }, { status: 500 })
  }
}
