import { NextRequest, NextResponse } from 'next/server'
import { analyzeRepo } from '@/lib/scorer'
import { auth } from '@/lib/auth'
import { parseRepoSlug } from '@/lib/repo-validation.mjs'

export async function GET(req: NextRequest) {
  const searchParams = new URL(req.url).searchParams
  const a = searchParams.get('a'), b = searchParams.get('b')
  if (!a || !b) return NextResponse.json({ error: 'a and b params required' }, { status: 400 })

  const parsedA = parseRepoSlug(a)
  const parsedB = parseRepoSlug(b)
  if (!parsedA || !parsedB) return NextResponse.json({ error: 'Invalid repository format. Use owner/name or an https://github.com/owner/name URL' }, { status: 400 })

  try {
    const session = await auth()
    const token = (session as any)?.accessToken ?? process.env.GITHUB_TOKEN
    const [ra, rb] = await Promise.all([
      analyzeRepo(parsedA.owner, parsedA.name, token),
      analyzeRepo(parsedB.owner, parsedB.name, token),
    ])
    return NextResponse.json({ a: ra, b: rb })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Compare failed' }, { status: 500 })
  }
}
