import test from 'node:test'
import assert from 'node:assert/strict'
import { consumeRateLimit, rateLimitDecision, rateLimitPolicy, requestIdentity } from '../lib/rate-limit.mjs'

test('allows requests under and at the endpoint limit, then blocks the next request', () => {
  assert.deepEqual(rateLimitDecision(0, 5), { allowed: true, remaining: 5 })
  assert.deepEqual(rateLimitDecision(5, 5), { allowed: true, remaining: 0 })
  assert.deepEqual(rateLimitDecision(6, 5), { allowed: false, remaining: 0 })
})

test('uses stricter policies for expensive endpoints', () => {
  assert.deepEqual(rateLimitPolicy('security'), { limit: 5, windowSeconds: 60 })
  assert.deepEqual(rateLimitPolicy('org'), { limit: 3, windowSeconds: 60 })
  assert.deepEqual(rateLimitPolicy('analyze'), { limit: 30, windowSeconds: 60 })
})

test('enforces a Redis-backed window and isolates endpoint identities', async () => {
  const counts = new Map()
  const fakeRedis = {
    async incr(key) {
      const next = (counts.get(key) ?? 0) + 1
      counts.set(key, next)
      return next
    },
    async expire() {},
  }
  const request = { headers: new Map([['x-forwarded-for', '203.0.113.10']]) }
  for (let i = 0; i < 5; i++) assert.equal((await consumeRateLimit(fakeRedis, requestIdentity(request), 'security')).allowed, true)
  assert.equal((await consumeRateLimit(fakeRedis, requestIdentity(request), 'security')).allowed, false)
  assert.equal((await consumeRateLimit(fakeRedis, 'ip:203.0.113.11', 'security')).allowed, true)
})

test('isolates authenticated identities and falls back to forwarded IPs', () => {
  const request = { headers: new Map([['x-forwarded-for', '203.0.113.10, 203.0.113.11']]) }
  assert.equal(requestIdentity(request, 'user@example.com'), 'user:user@example.com')
  assert.equal(requestIdentity(request), 'ip:203.0.113.10')
})
