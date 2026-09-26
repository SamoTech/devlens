const NOT_CONFIGURED_PATTERNS = [
  'not enabled',
  'not configured',
  'not analysed',
  'not analyzed',
  'project not found',
  'no requirements',
  'no supported package files',
  'no target url',
  'no commits found',
  'no check runs found',
]

const OPTIONAL_SCANNERS = new Set(['trufflehog', 'semgrep', 'nuclei', 'trivy'])

export const SCANNER_STATUS_VALUES = [
  'success',
  'failed',
  'unavailable',
  'not_configured',
  'rate_limited',
  'timeout',
  'unauthorized',
]

function errorText(result) {
  return String(result?.error ?? result?.message ?? '').toLowerCase()
}

/**
 * Convert existing module response conventions into one conservative status
 * contract. A result is only clean when its scanner completed successfully.
 */
export function classifyScannerStatus(source, result) {
  const text = errorText(result)
  if (text.includes('401') || text.includes('403') || text.includes('unauthorized') || text.includes('permission')) {
    return { source, status: 'unauthorized', error: result?.error }
  }
  if (text.includes('429') || text.includes('rate limit') || text.includes('rate_limited')) {
    return { source, status: 'rate_limited', error: result?.error }
  }
  if (text.includes('timeout') || text.includes('timed out') || text.includes('abort')) {
    return { source, status: 'timeout', error: result?.error }
  }
  if (text && NOT_CONFIGURED_PATTERNS.some(pattern => text.includes(pattern))) {
    return { source, status: 'not_configured', error: result?.error }
  }
  if (text) return { source, status: 'failed', error: result?.error }
  if (result?.enabled === false || result?.available === false) {
    return { source, status: 'unavailable', error: result?.error }
  }
  if (source === 'osv' && result?.packages_checked === 0) {
    return { source, status: 'not_configured', error: 'No supported dependency manifest detected' }
  }
  return { source, status: 'success' }
}

export function summarizeScannerStatuses(statuses) {
  const values = Object.values(statuses ?? {})
  const eligible = values.filter(({ source }) => !OPTIONAL_SCANNERS.has(source))
  const degraded = eligible.filter(({ status }) => status !== 'success')
  const failed = degraded.filter(({ status }) => ['failed', 'rate_limited', 'timeout', 'unauthorized'].includes(status)).length
  const unavailable = degraded.filter(({ status }) => ['unavailable', 'not_configured'].includes(status)).length
  const evidencePoints = eligible.reduce((sum, { status }) => {
    if (status === 'success') return sum + 1
    if (status === 'unavailable' || status === 'not_configured') return sum + 0.5
    return sum + 0.25
  }, 0)
  const evidenceCoverage = eligible.length
    ? Math.round((evidencePoints / eligible.length) * 100)
    : 0

  return {
    complete: degraded.length === 0,
    degraded: degraded.length > 0,
    failed,
    unavailable,
    eligible: eligible.length,
    successful: eligible.length - degraded.length,
    evidence_coverage: evidenceCoverage,
  }
}
