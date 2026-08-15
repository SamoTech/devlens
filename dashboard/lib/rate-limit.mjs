export function rateLimitDecision(count, limit) {
  const safeCount = Number.isFinite(count) ? count : Number.POSITIVE_INFINITY
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 1
  return {
    allowed: safeCount <= safeLimit,
    remaining: Math.max(0, safeLimit - safeCount),
  }
}

export function requestIdentity(req, userId) {
  if (userId) return `user:${String(userId).slice(0, 120)}`
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const ip = forwarded || req.headers.get('x-real-ip') || 'unknown'
  return `ip:${ip.slice(0, 120)}`
}

export async function consumeRateLimit(redis, identity, endpoint) {
  const policy = rateLimitPolicy(endpoint)
  if (!redis) return { allowed: true, degraded: true, policy, headers: new Headers() }

  const bucket = Math.floor(Date.now() / (policy.windowSeconds * 1000))
  const key = `devlens:ratelimit:${endpoint}:${identity}:${bucket}`
  try {
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, policy.windowSeconds)
    const decision = rateLimitDecision(Number(count), policy.limit)
    return {
      ...decision,
      degraded: false,
      policy,
      headers: {
        'X-RateLimit-Limit': String(policy.limit),
        'X-RateLimit-Remaining': String(decision.remaining),
        'Retry-After': String(policy.windowSeconds),
      },
    }
  } catch {
    // Redis outage must not make a healthy read-only API unavailable, but the
    // caller can expose this degraded protection state in observability.
    return { allowed: true, degraded: true, policy, headers: new Headers() }
  }
}

export function rateLimitPolicy(endpoint) {
  const policies = {
    analyze: { limit: 30, windowSeconds: 60 },
    advisory: { limit: 10, windowSeconds: 60 },
    security: { limit: 5, windowSeconds: 60 },
    compare: { limit: 10, windowSeconds: 60 },
    history: { limit: 30, windowSeconds: 60 },
    org: { limit: 3, windowSeconds: 60 },
    watchlist: { limit: 30, windowSeconds: 60 },
  }
  return policies[endpoint] ?? { limit: 10, windowSeconds: 60 }
}
