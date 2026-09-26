import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { parseRepoSlug } from '@/lib/repo-validation.mjs'
import { consumeRateLimit, requestIdentity } from '@/lib/rate-limit.mjs'
import { getRedis, getJson, setJson } from '@/lib/redis'
import { buildPrIntelligence } from '@/lib/pr-intelligence.mjs'

export const dynamic = 'force-dynamic'
const GH = 'https://api.github.com'

async function gh(path: string, token?: string): Promise<any> {
  const res = await fetch(GH + path, { headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, cache: 'no-store' })
  if (!res.ok) throw new Error('GitHub API ' + res.status + ': ' + res.statusText)
  return res.json()
}

export async function GET(req: NextRequest) {
  const params = new URL(req.url).searchParams
  const repoInput = params.get('repo')
  const numberInput = params.get('number')
  if (!repoInput || !numberInput) return NextResponse.json({ error: 'repo and number params required' }, { status: 400 })
  const repo = parseRepoSlug(repoInput)
  const number = Number(numberInput)
  if (!repo || !Number.isInteger(number) || number < 1 || number > 1000000) return NextResponse.json({ error: 'Invalid repository or pull request number' }, { status: 400 })
  try {
    const session = await auth()
    const token = (session as any)?.accessToken ?? process.env.GITHUB_TOKEN
    const limit = await consumeRateLimit(getRedis(), requestIdentity(req, (session as any)?.user?.email), 'pr')
    if (!limit.allowed) return NextResponse.json({ error: 'rate_limited' }, { status: 429, headers: limit.headers })
    const cacheKey = 'pr-intelligence:' + repo.owner + ':' + repo.name + ':' + number
    if (!params.has('force')) {
      const cached = await getJson<any>(cacheKey)
      if (cached) return NextResponse.json(cached, { headers: { 'X-DevLens-Cache': 'HIT' } })
    }
    const base = '/repos/' + repo.owner + '/' + repo.name + '/pulls/' + number
    const [pr, reviews, checks, files] = await Promise.all([
      gh(base, token),
      gh(base + '/reviews?per_page=100', token),
      gh('/repos/' + repo.owner + '/' + repo.name + '/commits/' + number + '/check-runs?per_page=100', token).catch(() => ({ check_runs: [] })),
      gh(base + '/files?per_page=100', token),
    ])
    const result = buildPrIntelligence(pr, reviews, checks.check_runs ?? [], files)
    const response = { ...result, cached: false }
    await setJson(cacheKey, response, 300)
    return NextResponse.json(response, { headers: { 'X-DevLens-Cache': 'MISS' } })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'PR intelligence failed' }, { status: 500 })
  }
}