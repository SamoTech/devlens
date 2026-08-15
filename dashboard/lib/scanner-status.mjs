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
  const degraded = values.filter(({ status }) => status !== 'success')
  return {
    complete: degraded.length === 0,
    degraded: degraded.length > 0,
    failed: degraded.filter(({ status }) => ['failed', 'rate_limited', 'timeout', 'unauthorized'].includes(status)).length,
    unavailable: degraded.filter(({ status }) => ['unavailable', 'not_configured'].includes(status)).length,
  }
}
