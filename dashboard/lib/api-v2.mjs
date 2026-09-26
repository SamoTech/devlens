export function normalizeV2Error(body) {
  const source = body && typeof body === 'object' ? body : {}
  const error = typeof source.error === 'string' ? source.error : 'request_failed'
  const message = typeof source.message === 'string' ? source.message : error
  return {
    code: ['rate_limited', 'Invalid repo format. Use owner/name or an https://github.com/owner/name URL', 'repo and number params required', 'Invalid repository or pull request number'].includes(error) ? error : 'request_failed',
    message,
  }
}
