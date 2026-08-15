import test from 'node:test'
import assert from 'node:assert/strict'
import { rateLimitDecision, rateLimitPolicy, requestIdentity } from '../lib/rate-limit.mjs'

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

test('isolates authenticated identities and falls back to forwarded IPs', () => {
  const request = { headers: new Map([['x-forwarded-for', '203.0.113.10, 203.0.113.11']]) }
  assert.equal(requestIdentity(request, 'user@example.com'), 'user:user@example.com')
  assert.equal(requestIdentity(request), 'ip:203.0.113.10')
})
