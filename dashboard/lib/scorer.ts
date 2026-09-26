import { DEFAULT_WEIGHTS, DimKey, Suggestion } from './constants'
import { getRedis } from './redis'
import { runAdvisoryCheck } from './advisory'
import { sanitizeWeights } from './weights.mjs'
import { scoreActivitySignals, scoreIssueMaintenance, scorePRMaintenance } from './scoring-metrics.mjs'
import { buildHistoryEvents, shouldStartNewSnapshot } from './history-events.mjs'

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
  scoreModel: 'dashboard-v2-9d'
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
    return scoreActivitySignals(data)
  } catch { return 0 }
}

function scoreFreshness(pushedAt: string): number {
  const timestamp = new Date(pushedAt).getTime()
  if (!Number.isFinite(timestamp)) return 0
  const days = Math.floor((Date.now() - timestamp) / 86400000)
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
    const [openIssues, closedIssues] = await Promise.all([
      ghFetch(`${GH}/repos/${owner}/${name}/issues?state=open&per_page=50`, token),
      ghFetch(`${GH}/repos/${owner}/${name}/issues?state=closed&per_page=50`, token),
    ])
    const now = Date.now()
    const isIssue = (item: any) => !item.pull_request
    const open = openIssues.filter(isIssue)
    const closed = closedIssues.filter(isIssue)
    const staleOpenCount = open.filter((item: any) => {
      const created = Date.parse(item.created_at ?? '')
      return Number.isFinite(created) && now - created > 90 * 86400000
    }).length
    const closedAgesDays = closed
      .map((item: any) => {
        const created = Date.parse(item.created_at ?? '')
        const closedAt = Date.parse(item.closed_at ?? '')
        return Number.isFinite(created) && Number.isFinite(closedAt)
          ? (closedAt - created) / 86400000
          : NaN
      })
      .filter(Number.isFinite)
    return scoreIssueMaintenance({
      openCount: Math.max(openCount, open.length),
      staleOpenCount,
      closedAgesDays,
    })
  } catch { return 50 }
}

function scoreCommunity(stars: number, forks: number): number {
  if (!Number.isFinite(stars) || !Number.isFinite(forks) || stars < 0 || forks < 0) return 0
  return Math.max(0, Math.min(Math.floor(Math.log1p(stars) * 15) + Math.floor(Math.log1p(forks) * 10), 100))
}

async function scorePRVelocity(owner: string, name: string, token?: string): Promise<number> {
  try {
    const [closed, open] = await Promise.all([
      ghFetch(`${GH}/repos/${owner}/${name}/pulls?state=closed&per_page=50&sort=updated&direction=desc`, token),
      ghFetch(`${GH}/repos/${owner}/${name}/pulls?state=open&per_page=50&sort=created&direction=desc`, token),
    ])
    const mergedAgesDays = closed
      .filter((p: any) => p.merged_at)
      .map((p: any) => (Date.parse(p.merged_at) - Date.parse(p.created_at)) / 86400000)
      .filter(Number.isFinite)
    const openAgesDays = open
      .map((p: any) => (Date.now() - Date.parse(p.created_at)) / 86400000)
      .filter(Number.isFinite)
    return scorePRMaintenance({ mergedAgesDays, openAgesDays })
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
    activity:    'Maintain a steady contribution cadence across the 90-day window rather than relying on short bursts of activity.',
    freshness:   'Push an update to main. Repos inactive for 30+ days score lower on freshness.',
    docs:        'Add missing files: LICENSE, CONTRIBUTING.md, CHANGELOG.md, SECURITY.md.',
    ci:          'Add GitHub Actions workflows. Even a basic lint/test workflow improves this score significantly.',
    issues:      'Triage stale issues and reduce long-running open work. DevLens now weighs issue age and resolution time.',
    community:   'Promote the repo. Stars and forks improve the community signal dimension.',
    pr_velocity: 'Reduce long-running pull requests. DevLens now weighs median and tail merge time plus stale open PRs.',
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

  // Always verify visibility before reading a shared cache. This prevents a
  // private report from ever being served through a public owner/name key.
  const repoData = await ghFetch(`${GH}/repos/${owner}/${name}`, token)
  if (repoData.private === true) {
    throw new Error('Private repositories are not supported')
  }

  if (redis && !customWeights) {
    try {
      const cached = await redis.get<string>(cacheKey)
      if (cached) {
        const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached
        return parsed as RepoReport
      }
    } catch {}
  }

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

  const weights = sanitizeWeights(customWeights, DEFAULT_WEIGHTS)
  const dimensions = Object.keys(DEFAULT_WEIGHTS) as DimKey[]
  const weightSum = dimensions.reduce((sum, key) => sum + weights[key], 0)
  const rawHealth = dimensions.reduce((sum, key) => sum + scores[key] * (weights[key] / weightSum), 0)
  const health = Number.isFinite(rawHealth)
    ? Math.max(0, Math.min(100, Math.round(rawHealth)))
    : 0

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
    scoreModel: 'dashboard-v2-9d',
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
      const histArr: any[] = existing
        ? (typeof existing === 'string' ? JSON.parse(existing) : existing)
        : []
      const now = new Date()
      const snapshot: any = {
        week: `W${now.toISOString().slice(5, 10)}`,
        score: health,
        date: now.toISOString(),
        scores,
        advisory: secResult.advisory,
      }
      const last = histArr[histArr.length - 1]
      if (shouldStartNewSnapshot(last?.date, now.getTime())) {
        snapshot.events = buildHistoryEvents(last, snapshot)
        histArr.push(snapshot)
      } else {
        snapshot.events = buildHistoryEvents(histArr.length > 1 ? histArr[histArr.length - 2] : undefined, snapshot)
        if (histArr.length > 0) histArr[histArr.length - 1] = snapshot
        else histArr.push(snapshot)
      }
      await redis.set(histKey, JSON.stringify(histArr.slice(-12)))    } catch {}
  }

  return report
}
