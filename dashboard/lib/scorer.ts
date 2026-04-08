import { DEFAULT_WEIGHTS, DimKey, Suggestion } from './constants'
import { getRedis } from './redis'
import { runAdvisoryCheck } from './advisory'

export interface DimScores {
  readme: number
  activity: number
  freshness: number
  docs: number
  ci: number
  issues: number
  community: number
  pr_velocity: number
  security: number
}

export interface RepoReport {
  repo: string
  owner: string
  name: string
  description: string | null
  stars: number
  forks: number
  language: string | null
  avatar: string
  url: string
  healthScore: number
  scores: DimScores
  suggestions: Suggestion[]
  badgeUrl: string
  generatedAt: string
  /** Lightweight advisory summary attached to every report */
  advisory?: {
    total:    number
    critical: number
    high:     number
    moderate: number
    low:      number
    ecosystems: string[]
  }
}

const GH = 'https://api.github.com'

function headers(token?: string) {
  return {
    Accept: 'application/vnd.github.json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function ghFetch(url: string, token?: string): Promise<any> {
  const r = await fetch(url, { headers: headers(token), next: { revalidate: 300 } })
  if (!r.ok) {
    const remaining = r.headers.get('x-ratelimit-remaining')
    if (r.status === 403 || r.status === 429 || remaining === '0') {
      const err: any = new Error('GitHub rate limit reached. Sign in with GitHub for 5000 req/hour.')
      err.code = 'rate_limited'
      throw err
    }
    throw new Error(`GitHub API error ${r.status} ${url}`)
  }
  return r.json()
}

function badgeShieldColor(s: number): string {
  if (s >= 80) return 'brightgreen'
  if (s >= 60) return 'green'
  if (s >= 40) return 'yellow'
  return 'red'
}

async function scoreReadme(owner: string, name: string, token?: string): Promise<number> {
  try {
    const data = await ghFetch(`${GH}/repos/${owner}/${name}/readme`, token)
    const content = atob(data.content.replace(/\n/g, ''))
    const lower = content.toLowerCase()
    let s = 0
    if (content.length > 500) s += 10
    if (content.length > 1500) s += 5
    if (content.length > 3000) s += 5
    for (const kw of ['install', 'usage', 'license', 'contribut', 'feature', 'example']) {
      if (lower.includes(kw)) s += 6
    }
    if (content.includes('```')) s += 8
    if (content.includes('![')) s += 6
    if (content.includes('##')) s += 4
    if (content.includes('- ')) s += 4
    if (lower.includes('setup')) s += 4
    if (lower.includes('roadmap')) s += 4
    if (lower.includes('sponsor') || lower.includes('support')) s += 4
    if (lower.includes('discord') || lower.includes('slack')) s += 4
    return Math.min(s, 100)
  } catch { return 0 }
}

async function scoreActivity(owner: string, name: string, token?: string): Promise<number> {
  try {
    const since = new Date()
    since.setDate(since.getDate() - 90)
    const data = await ghFetch(`${GH}/repos/${owner}/${name}/commits?since=${since.toISOString()}&per_page=100`, token)
    const n = data.length
    if (n >= 30) return 100
    if (n >= 15) return 75
    if (n >= 5) return 50
    if (n >= 1) return 25
    return 0
  } catch { return 0 }
}

function scoreFreshness(pushedAt: string): number {
  const days = Math.floor((Date.now() - new Date(pushedAt).getTime()) / 86400000)
  if (days <= 7) return 100
  if (days <= 30) return 80
  if (days <= 90) return 55
  if (days <= 180) return 30
  return 10
}

async function scoreDocs(owner: string, name: string, token?: string): Promise<number> {
  try {
    const tree = await ghFetch(`${GH}/repos/${owner}/${name}/git/trees/HEAD?recursive=1`, token)
    const paths: string[] = tree.tree.map((t: any) => t.path as string)
    const keyFiles = ['LICENSE', 'CONTRIBUTING.md', 'CHANGELOG.md', 'CODE_OF_CONDUCT.md', 'SECURITY.md', 'docs']
    let s = 0
    for (const f of keyFiles) {
      if (paths.some((p: string) => p.startsWith(f))) s += 16
    }
    return Math.min(s, 100)
  } catch { return 0 }
}

async function scoreCI(owner: string, name: string, token?: string): Promise<number> {
  try {
    const data = await ghFetch(`${GH}/repos/${owner}/${name}/actions/workflows`, token)
    const n = data.total_count ?? 0
    if (n >= 3) return 100
    if (n >= 1) return 60
    return 0
  } catch { return 0 }
}

async function scoreIssues(owner: string, name: string, openCount: number, token?: string): Promise<number> {
  try {
    const closed = await ghFetch(`${GH}/repos/${owner}/${name}/issues?state=closed&per_page=50`, token)
    const c = closed.length
    if (!c && openCount === 0) return 100
    const total = openCount + c
    if (total === 0) return 100
    return Math.round((c / total) * 100)
  } catch { return 50 }
}

function scoreCommunity(stars: number, forks: number): number {
  return Math.min(Math.floor(Math.log1p(stars) * 15) + Math.floor(Math.log1p(forks) * 10), 100)
}

async function scorePRVelocity(owner: string, name: string, token?: string): Promise<number> {
  try {
    const prs = await ghFetch(`${GH}/repos/${owner}/${name}/pulls?state=closed&per_page=20`, token)
    const merged = prs.filter((p: any) => p.merged_at)
    if (merged.length === 0) return 50
    const avgMs = merged.reduce((sum: number, p: any) => {
      return sum + (new Date(p.merged_at).getTime() - new Date(p.created_at).getTime())
    }, 0) / merged.length
    const avgDays = avgMs / 86400000
    if (avgDays < 1) return 100
    if (avgDays < 3) return 85
    if (avgDays < 7) return 65
    if (avgDays < 14) return 45
    if (avgDays < 30) return 25
    return 10
  } catch { return 50 }
}

/**
 * Real security score — powered by advisory.ts
 * Fetches actual CVE findings from GitHub Advisory DB + Dependabot + OSV.dev,
 * cross-referenced against the repo's installed package versions.
 * Falls back to file-presence heuristic if the advisory scan fails or times out.
 */
async function scoreSecurityReal(
  owner: string,
  name: string,
  token?: string,
  treePaths?: string[],
): Promise<{ score: number; advisory: RepoReport['advisory'] }> {
  try {
    const report = await runAdvisoryCheck(owner, name, token, treePaths)
    return {
      score:    report.securityScore,
      advisory: {
        total:      report.counts.total,
        critical:   report.counts.critical,
        high:       report.counts.high,
        moderate:   report.counts.moderate,
        low:        report.counts.low,
        ecosystems: report.ecosystems,
      },
    }
  } catch {
    // Fallback: file-presence heuristic (original logic)
    const paths = treePaths ?? []
    let s = 0
    if (paths.some(p => p === 'security.md' || p.endsWith('/security.md'))) s += 30
    if (paths.some(p => p.includes('dependabot.yml') || p.includes('dependabot.yaml'))) s += 35
    if (paths.some(p => p.includes('.github/workflows/') && (
      p.includes('codeql') || p.includes('trivy') || p.includes('snyk')
    ))) s += 35
    return { score: Math.min(s, 100), advisory: undefined }
  }
}

function buildSuggestions(scores: DimScores, advisoryCounts?: RepoReport['advisory']): Suggestion[] {
  const critHigh = (advisoryCounts?.critical ?? 0) + (advisoryCounts?.high ?? 0)
  const MSGS: Record<DimKey, string> = {
    readme:      'Add a usage section, code examples, and at least one screenshot or GIF to your README.',
    activity:    'Commit more regularly. Aim for at least 15 commits per 90 days.',
    freshness:   'Push an update to main. Repos inactive for 30+ days score lower on freshness.',
    docs:        'Add missing files: LICENSE, CONTRIBUTING.md, CHANGELOG.md, SECURITY.md.',
    ci:          'Add GitHub Actions workflows. Even a basic lint/test workflow improves this score significantly.',
    issues:      'Close or triage open issues. A high open:closed ratio signals poor maintenance.',
    community:   'Promote the repo. Stars and forks improve the community signal dimension.',
    pr_velocity: 'Merge pull requests faster. Aim for an average PR merge time under 7 days.',
    security:    critHigh > 0
      ? `${critHigh} critical/high CVE(s) found in installed dependencies. Run the Advisory scan for fix versions.`
      : 'Add SECURITY.md, configure Dependabot in .github/dependabot.yml, and consider CodeQL scanning.',
  }
  return (Object.keys(scores) as DimKey[])
    .filter(k => scores[k] < 80)
    .map(k => ({ dim: k, message: MSGS[k] }))
}

export async function analyzeRepo(
  owner: string,
  name: string,
  token?: string,
  customWeights?: Partial<Record<DimKey, number>>
): Promise<RepoReport> {
  const redis = getRedis()
  const cacheKey = `cache:${owner}:${name}`

  if (redis && !customWeights) {
    try {
      const cached = await redis.get<string>(cacheKey)
      if (cached) {
        const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached
        return parsed as RepoReport
      }
    } catch {}
  }

  const repoData = await ghFetch(`${GH}/repos/${owner}/${name}`, token)

  // Fetch tree once, share with scoreDocs + scoreSecurityReal to save API calls
  let treePaths: string[] = []
  try {
    const tree = await ghFetch(`${GH}/repos/${owner}/${name}/git/trees/HEAD?recursive=1`, token)
    treePaths = tree.tree.map((t: any) => (t.path as string).toLowerCase())
  } catch {}

  const [readme, activity, docs, ci, issues, pr_velocity, secResult] = await Promise.all([
    scoreReadme(owner, name, token),
    scoreActivity(owner, name, token),
    // docs uses the already-fetched treePaths
    (async () => {
      const keyFiles = ['license', 'contributing.md', 'changelog.md', 'code_of_conduct.md', 'security.md', 'docs']
      let s = 0
      for (const f of keyFiles) {
        if (treePaths.some((p: string) => p.startsWith(f))) s += 16
      }
      return Math.min(s, 100)
    })(),
    scoreCI(owner, name, token),
    scoreIssues(owner, name, repoData.open_issues_count, token),
    scorePRVelocity(owner, name, token),
    scoreSecurityReal(owner, name, token, treePaths),
  ])

  const scores: DimScores = {
    readme,
    activity,
    freshness: scoreFreshness(repoData.pushed_at),
    docs,
    ci,
    issues,
    community: scoreCommunity(repoData.stargazers_count, repoData.forks_count),
    pr_velocity,
    security:  secResult.score,
  }

  const weights = { ...DEFAULT_WEIGHTS, ...customWeights }
  const weightSum = Object.values(weights).reduce((a, b) => a + b, 0)
  const health = Math.round(
    (Object.keys(weights) as DimKey[]).reduce((sum, k) => sum + scores[k] * (weights[k] / weightSum), 0)
  )

  const badgeUrl = `https://img.shields.io/badge/DevLens%20Health-${health}%2F100-${badgeShieldColor(health)}?style=flat-square&logo=github`
  const suggestions = buildSuggestions(scores, secResult.advisory)

  const report: RepoReport = {
    repo: `${owner}/${name}`,
    owner,
    name,
    description: repoData.description,
    stars: repoData.stargazers_count,
    forks: repoData.forks_count,
    language: repoData.language,
    avatar: repoData.owner.avatar_url,
    url: repoData.html_url,
    healthScore: health,
    scores,
    suggestions,
    badgeUrl,
    generatedAt: new Date().toISOString(),
    advisory: secResult.advisory,
  }

  if (redis && !customWeights) {
    try {
      await redis.set(cacheKey, JSON.stringify(report), { ex: 900 })
      const histKey = `history:${owner}:${name}`
      const existing = await redis.get<any>(histKey)
      const histArr: { week: string; score: number; date: string }[] = existing
        ? (typeof existing === 'string' ? JSON.parse(existing) : existing)
        : []
      histArr.push({ week: `W${new Date().toISOString().slice(5, 10)}`, score: health, date: new Date().toISOString() })
      await redis.set(histKey, JSON.stringify(histArr.slice(-12)))
    } catch {}
  }

  return report
}
