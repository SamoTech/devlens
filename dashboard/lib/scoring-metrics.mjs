const DAY_MS = 86_400_000

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value))
}

function median(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b)
  if (!sorted.length) return null
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function percentile(values, p) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b)
  if (!sorted.length) return null
  const index = (sorted.length - 1) * p
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) return sorted[lower]
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower)
}

function tier(value, thresholds) {
  for (const [limit, score] of thresholds) {
    if (value <= limit) return score
  }
  return thresholds[thresholds.length - 1][1]
}

export function scoreActivitySignals(commits, now = Date.now()) {
  const dates = commits
    .map(c => c?.commit?.author?.date ?? c?.commit?.committer?.date)
    .map(value => Date.parse(value ?? ''))
    .filter(Number.isFinite)

  if (!dates.length) return 0

  const recent30 = dates.filter(t => now - t <= 30 * DAY_MS).length
  const weeks = new Set(dates.map(t => Math.floor((now - t) / (7 * DAY_MS)))).size
  const countScore = tier(dates.length, [[0, 0], [1, 20], [4, 45], [14, 70], [29, 90], [Infinity, 100]])
  const cadenceScore = tier(weeks, [[0, 0], [1, 15], [3, 35], [7, 60], [11, 80], [Infinity, 100]])
  const recentScore = tier(recent30, [[0, 0], [1, 20], [2, 40], [5, 65], [10, 85], [Infinity, 100]])

  return Math.round(countScore * 0.5 + cadenceScore * 0.3 + recentScore * 0.2)
}

export function scoreIssueMaintenance({ openCount, staleOpenCount, closedAgesDays = [] }) {
  const open = Math.max(0, Number(openCount) || 0)
  const stale = Math.min(open, Math.max(0, Number(staleOpenCount) || 0))
  const closed = closedAgesDays.filter(Number.isFinite)

  if (open === 0 && closed.length === 0) return 100

  const triageScore = open === 0 ? 100 : clamp(100 - (stale / open) * 85)
  const resolutionDays = median(closed)
  const resolutionScore = resolutionDays === null
    ? 50
    : tier(resolutionDays, [[3, 100], [7, 90], [14, 80], [30, 65], [60, 50], [90, 35], [180, 20], [Infinity, 10]])

  return Math.round(triageScore * 0.6 + resolutionScore * 0.4)
}

export function scorePRMaintenance({ mergedAgesDays = [], openAgesDays = [] }) {
  const merged = mergedAgesDays.filter(Number.isFinite)
  const open = openAgesDays.filter(Number.isFinite)
  if (!merged.length && !open.length) return 50

  const medianDays = median(merged)
  const p90Days = percentile(merged, 0.9)
  const staleRatio = open.length ? open.filter(days => days > 30).length / open.length : 0

  const medianScore = medianDays === null ? 50 : tier(medianDays, [[1, 100], [3, 90], [7, 75], [14, 60], [30, 40], [Infinity, 15]])
  const p90Score = p90Days === null ? 50 : tier(p90Days, [[3, 100], [7, 90], [14, 70], [30, 50], [60, 30], [Infinity, 10]])
  const openScore = clamp(100 - staleRatio * 90)

  return Math.round(medianScore * 0.5 + p90Score * 0.25 + openScore * 0.25)
}

export { median, percentile }
