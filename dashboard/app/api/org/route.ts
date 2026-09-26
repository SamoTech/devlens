import { NextRequest, NextResponse } from 'next/server'
import { analyzeRepo } from '@/lib/scorer'
import { auth } from '@/lib/auth'
import { consumeRateLimit, requestIdentity } from '@/lib/rate-limit.mjs'
import { getRedis } from '@/lib/redis'

const ORG_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/

export async function GET(req: NextRequest) {
  const org = new URL(req.url).searchParams.get('org')
  if (!org || org.length > 39 || !ORG_PATTERN.test(org)) {
    return NextResponse.json({ error: 'Invalid organization name' }, { status: 400 })
  }

  try {
    const session = await auth()
    const token = (session as any)?.accessToken ?? process.env.GITHUB_TOKEN
    const limit = await consumeRateLimit(getRedis(), requestIdentity(req, (session as any)?.user?.email), 'org')
    if (!limit.allowed) return NextResponse.json({ error: 'rate_limited', message: 'Organization analysis rate limit exceeded. Try again shortly.' }, { status: 429, headers: limit.headers })

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

    const portfolio = {
      total: reports.length,
      averageHealth: reports.length ? Math.round(reports.reduce((sum: number, r: any) => sum + r.healthScore, 0) / reports.length) : 0,
      healthy: reports.filter((r: any) => r.healthScore >= 80).length,
      needsAttention: reports.filter((r: any) => r.healthScore < 60).length,
      critical: reports.filter((r: any) => r.healthScore < 40).length,
      vulnerabilities: reports.reduce((sum: number, r: any) => sum + (r.advisory?.total ?? 0), 0),
      criticalVulnerabilities: reports.reduce((sum: number, r: any) => sum + (r.advisory?.critical ?? 0), 0),
      reposWithSecurityFindings: reports.filter((r: any) => (r.advisory?.total ?? 0) > 0).length,
      reposWithoutCi: reports.filter((r: any) => r.scores?.ci === 0).length,
    }

    return NextResponse.json({ org, repos: reports, portfolio })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Org analysis failed' }, { status: 500 })
  }
}
