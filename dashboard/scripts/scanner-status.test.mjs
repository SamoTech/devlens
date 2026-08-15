import test from 'node:test'
import assert from 'node:assert/strict'
import { classifyScannerStatus, summarizeScannerStatuses } from '../lib/scanner-status.mjs'

test('classifies successful clean and finding-bearing scanners as success', () => {
  assert.deepEqual(classifyScannerStatus('osv', { packages_checked: 2, findings: [] }), { source: 'osv', status: 'success' })
  assert.deepEqual(classifyScannerStatus('dependabot', { enabled: true, findings: [{ id: 'GHSA-1' }] }), { source: 'dependabot', status: 'success' })
})

test('classifies unavailable, not-configured, unauthorized, rate-limited, and timeout states', () => {
  assert.equal(classifyScannerStatus('secrets', { enabled: false, error: 'Scanner not configured: GITHUB_TOKEN missing' }).status, 'not_configured')
  assert.equal(classifyScannerStatus('dependabot', { enabled: false, error: 'Unauthorized or insufficient permissions' }).status, 'unauthorized')
  assert.equal(classifyScannerStatus('nvd', { available: false, error: 'NVD returned 429' }).status, 'rate_limited')
  assert.equal(classifyScannerStatus('osv', { error: 'request timeout' }).status, 'timeout')
  assert.equal(classifyScannerStatus('sonarcloud', { available: false, error: 'Project not found on SonarCloud' }).status, 'not_configured')
  assert.equal(classifyScannerStatus('trivy', { available: false, message: 'Scanner not configured for this hosted endpoint' }).status, 'not_configured')
})

test('summarizes mixed results as degraded and records failed versus unavailable scanners', () => {
  const summary = summarizeScannerStatuses({
    clean: { source: 'clean', status: 'success' },
    failed: { source: 'failed', status: 'failed' },
    unavailable: { source: 'unavailable', status: 'unavailable' },
    limited: { source: 'limited', status: 'rate_limited' },
  })
  assert.deepEqual(summary, { complete: false, degraded: true, failed: 2, unavailable: 1 })
})
