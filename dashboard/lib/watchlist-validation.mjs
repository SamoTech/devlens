import { parseRepoSlug } from './repo-validation.mjs'

const ORG_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/

export function normalizeWatchEntry(raw) {
  if (!raw || typeof raw !== 'object') return null
  const value = raw
  const parsed = parseRepoSlug(value.slug ?? null)
  if (!parsed) return null
  const score = Number(value.score)
  return {
    slug: parsed.slug,
    score: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0,
    description: typeof value.description === 'string' ? value.description.slice(0, 500) : null,
    language: typeof value.language === 'string' ? value.language.slice(0, 80) : null,
    savedAt: new Date().toISOString(),
  }
}

export function normalizeOrgEntry(raw) {
  if (!raw || typeof raw !== 'object') return null
  const value = raw
  const org = typeof value.org === 'string' ? value.org.trim() : ''
  if (!org || org.length > 39 || !ORG_PATTERN.test(org)) return null
  const repoCount = Number(value.repoCount)
  const avgScore = Number(value.avgScore)
  return {
    org,
    repoCount: Number.isFinite(repoCount) ? Math.max(0, Math.min(30, Math.floor(repoCount))) : 0,
    avgScore: Number.isFinite(avgScore) ? Math.max(0, Math.min(100, Math.round(avgScore))) : 0,
    topRepo: typeof value.topRepo === 'string' ? value.topRepo.slice(0, 200) : null,
    savedAt: new Date().toISOString(),
  }
}
