export const DIMMETA = [
  { key: 'readme',      emoji: '📄', label: 'README Quality',  weight: '20%' },
  { key: 'activity',   emoji: '⚡', label: 'Commit Activity',  weight: '20%' },
  { key: 'freshness',  emoji: '🕐', label: 'Repo Freshness',   weight: '10%' },
  { key: 'docs',       emoji: '📚', label: 'Documentation',    weight: '10%' },
  { key: 'ci',         emoji: '🔧', label: 'CI/CD Setup',      weight: '10%' },
  { key: 'issues',     emoji: '🐛', label: 'Issue Response',   weight: '10%' },
  { key: 'community',  emoji: '⭐', label: 'Community Signal', weight: '5%'  },
  { key: 'pr_velocity',emoji: '🔀', label: 'PR Velocity',      weight: '10%' },
  { key: 'security',   emoji: '🔒', label: 'Security',         weight: '5%'  },
] as const

export type DimKey = typeof DIMMETA[number]['key']

export const DEFAULT_WEIGHTS: Record<DimKey, number> = {
  readme:      0.20,
  activity:    0.20,
  freshness:   0.10,
  docs:        0.10,
  ci:          0.10,
  issues:      0.10,
  community:   0.05,
  pr_velocity: 0.10,
  security:    0.05,
}

export function badgeColor(s: number): string {
  if (s >= 80) return '#22c55e'
  if (s >= 60) return '#84cc16'
  if (s >= 40) return '#eab308'
  return '#ef4444'
}

export function scoreLabel(s: number): string {
  if (s >= 90) return 'Excellent'
  if (s >= 75) return 'Good'
  if (s >= 60) return 'Fair'
  if (s >= 40) return 'Needs Work'
  return 'Critical'
}
