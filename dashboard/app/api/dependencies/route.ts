import { NextRequest, NextResponse } from 'next/server'
import { runAdvisoryCheck } from '@/lib/advisory'
import { buildDependencyInventory } from '@/lib/dependency-intelligence.mjs'
import { auth } from '@/lib/auth'
import { parseRepoSlug } from '@/lib/repo-validation.mjs'
import { getJson, getRedis, setJson } from '@/lib/redis'
import { consumeRateLimit, requestIdentity } from '@/lib/rate-limit.mjs'

type DependencyRecord = {
  name: string
  ecosystem: string
  installedVersion: string
  latestVersion: string | null
  updateType: 'up_to_date' | 'patch' | 'minor' | 'major' | 'unknown'
  vulnerabilityCount: number
  highestSeverity: string | null
  patchedVersion: string | null
  sources: string[]
}

export const dynamic = 'force-dynamic'

const CACHE_TTL = 1800

export async function GET(req: NextRequest) {
  const repo = new URL(req.url).searchParams.get('repo')
  const parsedRepo = parseRepoSlug(repo)
  if (!parsedRepo) {
    return NextResponse.json({ error: 'Invalid repo format. Use owner/name or a GitHub URL' }, { status: 400 })
  }

  const { owner, name } = parsedRepo
  const cacheKey = `dependencies:${owner}:${name}`
  const session = await auth()
  const identity = requestIdentity(req, (session as any)?.user?.email)
  const redis = getRedis()
  const limit = await consumeRateLimit(redis, identity, 'advisory')
  if (!limit.allowed) {
    return NextResponse.json({ error: 'rate_limited', message: 'Dependency scan rate limit exceeded. Try again shortly.' }, { status: 429, headers: limit.headers })
  }

  const cached = await getJson<any>(cacheKey)
  if (cached) return NextResponse.json({ ...cached, cached: true })

  try {
    const token = (session as any)?.accessToken ?? process.env.GITHUB_TOKEN
    const advisory = await runAdvisoryCheck(owner, name, token)
    const dependencies = await buildDependencyInventory(advisory) as DependencyRecord[]
    const report = {
      repo: `${owner}/${name}`,
      scannedAt: new Date().toISOString(),
      packages: dependencies,
      summary: {
        total: dependencies.length,
        npm: dependencies.filter(d => d.ecosystem === 'npm').length,
        vulnerable: dependencies.filter(d => d.vulnerabilityCount > 0).length,
        outdated: dependencies.filter(d => d.updateType !== 'up_to_date' && d.updateType !== 'unknown').length,
        majorUpdates: dependencies.filter(d => d.updateType === 'major').length,
      },
    }
    await setJson(cacheKey, report, CACHE_TTL)
    return NextResponse.json(report)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Dependency scan failed' }, { status: 500 })
  }
}
