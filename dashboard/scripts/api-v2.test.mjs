import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeV2Error } from '../lib/api-v2.mjs'

test('normalizes known v2 errors', () => {
  assert.deepEqual(normalizeV2Error({ error: 'rate_limited', message: 'Too many requests' }), {
    code: 'rate_limited',
    message: 'Too many requests',
  })
})

test('normalizes generic errors', () => {
  assert.deepEqual(normalizeV2Error({ error: 'Analysis failed' }), {
    code: 'request_failed',
    message: 'Analysis failed',
  })
})
