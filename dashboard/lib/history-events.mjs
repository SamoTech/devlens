const DIMENSION_LABELS = {
  readme: 'README quality',
  activity: 'activity',
  freshness: 'freshness',
  docs: 'documentation',
  ci: 'CI/CD',
  issues: 'issue maintenance',
  community: 'community signal',
  pr_velocity: 'PR maintenance',
  security: 'security',
}

export function buildHistoryEvents(previous, current) {
  if (!previous) return ['Initial DevLens baseline recorded']
  const events = []
  const delta = current.score - previous.score
  if (Math.abs(delta) >= 5) events.push(`Health ${delta > 0 ? 'improved' : 'declined'} by ${Math.abs(delta)} points`)

  for (const [key, label] of Object.entries(DIMENSION_LABELS)) {
    const before = previous.scores?.[key]
    const after = current.scores?.[key]
    if (Number.isFinite(before) && Number.isFinite(after) && Math.abs(after - before) >= 10) {
      events.push(`${label} ${after > before ? 'improved' : 'declined'} by ${Math.abs(after - before)} points`)
    }
  }

  const previousVulns = previous.advisory?.total ?? 0
  const currentVulns = current.advisory?.total ?? 0
  if (currentVulns !== previousVulns) {
    events.push(`Known vulnerabilities ${currentVulns > previousVulns ? 'increased' : 'decreased'} from ${previousVulns} to ${currentVulns}`)
  }

  const previousCritical = previous.advisory?.critical ?? 0
  const currentCritical = current.advisory?.critical ?? 0
  if (currentCritical !== previousCritical) {
    events.push(`Critical vulnerabilities ${currentCritical > previousCritical ? 'increased' : 'decreased'} from ${previousCritical} to ${currentCritical}`)
  }

  return events.slice(0, 6)
}

export function shouldStartNewSnapshot(lastDate, now = Date.now()) {
  if (!lastDate) return true
  const timestamp = Date.parse(lastDate)
  if (!Number.isFinite(timestamp)) return true
  return now - timestamp >= 7 * 86400000
}
