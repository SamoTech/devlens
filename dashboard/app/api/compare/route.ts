import { NextRequest, NextResponse } from 'next/server'
import { analyzeRepo } from '@/lib/scorer'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const searchParams = new URL(req.url).searchParams
  const a = searchParams.get('a'), b = searchParams.get('b')
  if (!a || !b) return NextResponse.json({ error: 'a and b params required' }, { status: 400 })

  function parse(r: string) {
    const p = r.replace('https://github.com/', '').replace(/\/$/, '').split('/')
    return { owner: p[0], name: p[1] }
  }

  try {
    const session = await auth()
    const token = (session as any)?.accessToken ?? process.env.GITHUB_TOKEN
    const [ra, rb] = await Promise.all([
      analyzeRepo(parse(a).owner, parse(a).name, token),
      analyzeRepo(parse(b).owner, parse(b).name, token),
    ])
    return NextResponse.json({ a: ra, b: rb })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Compare failed' }, { status: 500 })
  }
}
