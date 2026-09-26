export function classifyChangeSize(additions, deletions, filesChanged) {
  const lines = Math.max(0, Number(additions) || 0) + Math.max(0, Number(deletions) || 0)
  const files = Math.max(0, Number(filesChanged) || 0)
  if (lines <= 50 && files <= 5) return 'small'
  if (lines <= 250 && files <= 15) return 'medium'
  if (lines <= 750 && files <= 30) return 'large'
  return 'very_large'
}

export function summarizeReviewState(reviews = []) {
  const latestByUser = new Map()
  for (const review of reviews) {
    if (!review?.user?.login) continue
    latestByUser.set(review.user.login, review)
  }
  const latest = [...latestByUser.values()]
  return {
    approvals: latest.filter(r => r.state === 'APPROVED').length,
    changesRequested: latest.filter(r => r.state === 'CHANGES_REQUESTED').length,
    commented: latest.filter(r => r.state === 'COMMENTED').length,
  }
}

export function summarizeChecks(checks = []) {
  const list = Array.isArray(checks) ? checks : []
  const successful = list.filter(c => c.conclusion === 'success').length
  const failed = list.filter(c => ['failure', 'cancelled', 'timed_out', 'action_required'].includes(c.conclusion)).length
  const pending = list.filter(c => !c.conclusion || c.status !== 'completed').length
  return { total: list.length, successful, failed, pending, status: failed ? 'failing' : pending ? 'pending' : list.length ? 'passing' : 'no_checks' }
}

export function detectSensitiveFiles(files = []) {
  const patterns = [/^\.github\//i, /(^|\/)package-lock\.json$/i, /(^|\/)pnpm-lock\.yaml$/i, /(^|\/)yarn\.lock$/i, /(^|\/)requirements[^/]*\.txt$/i, /(^|\/)Dockerfile/i, /(^|\/)\.env/i, /(^|\/)terraform/i, /(^|\/)auth/i, /(^|\/)security/i]
  return files.filter(file => patterns.some(pattern => pattern.test(file.filename || ''))).map(file => file.filename).slice(0, 30)
}

export function buildPrIntelligence(pr, reviews, checks, files) {
  const review = summarizeReviewState(reviews)
  const ci = summarizeChecks(checks)
  const sensitiveFiles = detectSensitiveFiles(files)
  const size = classifyChangeSize(pr.additions, pr.deletions, pr.changed_files)
  const createdAt = new Date(pr.created_at).getTime()
  const ageHours = Number.isFinite(createdAt) ? Math.max(0, Math.round((Date.now() - createdAt) / 3600000)) : null
  const riskSignals = []
  if (size === 'large' || size === 'very_large') riskSignals.push('large_change')
  if (ci.status === 'failing') riskSignals.push('failing_checks')
  if (ci.status === 'pending') riskSignals.push('pending_checks')
  if (review.changesRequested > 0) riskSignals.push('changes_requested')
  if (sensitiveFiles.length) riskSignals.push('sensitive_files_touched')
  if (pr.mergeable === false) riskSignals.push('not_mergeable')
  return { number: pr.number, title: pr.title, state: pr.state, draft: Boolean(pr.draft), author: pr.user?.login ?? null, htmlUrl: pr.html_url, base: pr.base?.ref ?? null, head: pr.head?.ref ?? null, additions: pr.additions, deletions: pr.deletions, changedFiles: pr.changed_files, changeSize: size, ageHours, mergeable: pr.mergeable, mergeableState: pr.mergeable_state ?? null, review, checks: ci, sensitiveFiles, riskSignals, generatedAt: new Date().toISOString() }
}