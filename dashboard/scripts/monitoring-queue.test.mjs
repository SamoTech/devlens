import test from 'node:test'
import assert from 'node:assert/strict'
import { buildMonitorJob, parseMonitorJob, shouldQueueMonitorEvent } from '../lib/monitoring-queue.mjs'

test('queues supported repository events only', () => {
  assert.equal(shouldQueueMonitorEvent('push', 'SamoTech/devlens'), true)
  assert.equal(shouldQueueMonitorEvent('ping', 'SamoTech/devlens'), false)
  assert.equal(shouldQueueMonitorEvent('push', null), false)
})

test('builds and parses a monitor job', () => {
  const job = buildMonitorJob('SamoTech/devlens', 'pull_request', 'delivery-1')
  assert.equal(job.repository, 'SamoTech/devlens')
  assert.equal(parseMonitorJob(job).delivery, 'delivery-1')
})

test('rejects malformed jobs', () => {
  assert.equal(parseMonitorJob(null), null)
  assert.equal(parseMonitorJob({ repository: 'bad' }), null)
})