import test from 'node:test'
import assert from 'node:assert/strict'
import { scoreActivitySignals, scoreIssueMaintenance, scorePRMaintenance } from '../lib/scoring-metrics.mjs'

const NOW = Date.parse('2026-09-26T00:00:00Z')
const commit = daysAgo => ({ commit: { author: { date: new Date(NOW - daysAgo * 86_400_000).toISOString() } } })

test('activity rewards sustained cadence instead of raw commit volume alone', () => {
  const burst = Array.from({ length: 30 }, () => commit(10))
  const sustained = Array.from({ length: 30 }, (_, i) => commit(i * 3))
  assert.ok(scoreActivitySignals(sustained, NOW) > scoreActivitySignals(burst, NOW))
})

test('issue maintenance penalizes stale open issues', () => {
  const healthy = scoreIssueMaintenance({ openCount: 10, staleOpenCount: 0, closedAgesDays: [2, 4, 7, 10] })
  const stale = scoreIssueMaintenance({ openCount: 10, staleOpenCount: 8, closedAgesDays: [2, 4, 7, 10] })
  assert.ok(healthy > stale)
})

test('PR maintenance uses robust merge-time signals and stale open PRs', () => {
  const healthy = scorePRMaintenance({ mergedAgesDays: [1, 2, 3, 4, 5], openAgesDays: [2, 5] })
  const slow = scorePRMaintenance({ mergedAgesDays: [10, 20, 40, 60, 90], openAgesDays: [45, 60] })
  assert.ok(healthy > slow)
})

test('empty PR history remains neutral', () => {
  assert.equal(scorePRMaintenance({}), 50)
})
