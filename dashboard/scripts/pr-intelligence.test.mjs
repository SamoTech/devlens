import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPrIntelligence, classifyChangeSize, detectSensitiveFiles, summarizeChecks, summarizeReviewState } from '../lib/pr-intelligence.mjs'

test('classifies PR change size', () => {
  assert.equal(classifyChangeSize(10, 10, 2), 'small')
  assert.equal(classifyChangeSize(100, 100, 8), 'medium')
  assert.equal(classifyChangeSize(350, 350, 20), 'large')
  assert.equal(classifyChangeSize(1000, 1000, 40), 'very_large')
})

test('deduplicates reviews by reviewer', () => {
  const result = summarizeReviewState([{ user: { login: 'a' }, state: 'COMMENTED' }, { user: { login: 'a' }, state: 'APPROVED' }, { user: { login: 'b' }, state: 'CHANGES_REQUESTED' }])
  assert.deepEqual(result, { approvals: 1, changesRequested: 1, commented: 0 })
})

test('summarizes CI checks', () => {
  assert.deepEqual(summarizeChecks([{ status: 'completed', conclusion: 'success' }, { status: 'completed', conclusion: 'failure' }, { status: 'in_progress', conclusion: null }]), { total: 3, successful: 1, failed: 1, pending: 1, status: 'failing' })
})

test('detects sensitive files', () => {
  assert.deepEqual(detectSensitiveFiles([{ filename: 'src/app.ts' }, { filename: '.github/workflows/ci.yml' }, { filename: 'package-lock.json' }]), ['.github/workflows/ci.yml', 'package-lock.json'])
})

test('builds evidence signals', () => {
  const result = buildPrIntelligence({ number: 42, title: 'Update auth', state: 'open', draft: false, user: { login: 'ossama' }, html_url: 'https://github.com/example/repo/pull/42', base: { ref: 'main' }, head: { ref: 'feature/auth' }, additions: 400, deletions: 200, changed_files: 18, created_at: new Date().toISOString(), mergeable: false, mergeable_state: 'blocked' }, [{ user: { login: 'reviewer' }, state: 'APPROVED' }], [{ status: 'completed', conclusion: 'success' }], [{ filename: 'auth/login.ts' }])
  assert.equal(result.changeSize, 'large')
  assert.equal(result.review.approvals, 1)
  assert.equal(result.checks.status, 'passing')
  assert.ok(result.riskSignals.includes('sensitive_files_touched'))
  assert.ok(result.riskSignals.includes('not_mergeable'))
})