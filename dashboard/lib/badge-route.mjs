export function buildBadgeHeaders({ cacheSeconds = 3600 } = {}) {
  return {
    'Content-Type': 'image/svg+xml; charset=utf-8',
    'Cache-Control': `public, s-maxage=${cacheSeconds}, stale-while-revalidate=86400`,
  }
}

export function buildBadgeErrorResponse(message = 'DevLens score unavailable') {
  return { error: message }
}
