import test from 'node:test'
import assert from 'node:assert/strict'
import { buildHistoryEvents, shouldStartNewSnapshot } from '../lib/history-events.mjs'

test('history events identify meaningful health and security changes', () => {
  const events = buildHistoryEvents(
    { score: 70, scores: { security: 60, docs: 50 }, advisory: { total: 4, critical: 1 } },
    { score: 78, scores: { security: 75, docs: 40 }, advisory: { total: 2, critical: 0 } },
  )
  assert.ok(events.some(e => e.includes('Health improved')))
  assert.ok(events.some(e => e.includes('security improved')))
  assert.ok(events.some(e => e.includes('vulnerabilities decreased')))
})

test('history snapshots remain weekly rather than per-request', () => {
  const now = Date.parse('2026-09-26T00:00:00Z')
  assert.equal(shouldStartNewSnapshot('2026-09-20T00:00:00Z', now), false)
  assert.equal(shouldStartNewSnapshot('2026-09-18T00:00:00Z', now), true)
  assert.equal(shouldStartNewSnapshot(null, now), true)
})
