import { NextRequest, NextResponse } from 'next/server'
import { analyzeRepo } from '@/lib/scorer'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const org = new URL(req.url).searchParams.get('org')
  if (!org) return NextResponse.json({ error: 'org param required' }, { status: 400 })

  try {
    const session = await auth()
    const token = (session as any)?.accessToken ?? process.env.GITHUB_TOKEN

    const hdrs: Record<string, string> = {
      Accept: 'application/vnd.github.json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }

    const res = await fetch(
      `https://api.github.com/orgs/${org}/repos?type=public&sort=pushed&per_page=30`,
      { headers: hdrs }
    )
    if (!res.ok) throw new Error(`GitHub API error ${res.status}`)
    const repos = await res.json()

    const results = await Promise.allSettled(
      repos.map((r: any) => analyzeRepo(r.owner.login, r.name, token))
    )

    const reports = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map(r => r.value)
      .sort((a: any, b: any) => b.healthScore - a.healthScore)

    return NextResponse.json({ org, repos: reports })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Org analysis failed' }, { status: 500 })
  }
}
