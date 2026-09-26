import test from 'node:test'
import assert from 'node:assert/strict'
import { classifyUpdate, compareVersions } from '../lib/dependency-intelligence'

test('compares semantic versions', () => {
  assert.equal(compareVersions('1.2.3', '1.2.3'), 0)
  assert.equal(compareVersions('1.2.3', '1.3.0'), -1)
  assert.equal(compareVersions('2.0.0', '1.9.9'), 1)
})

test('classifies update levels', () => {
  assert.equal(classifyUpdate('1.2.3', '1.2.4'), 'patch')
  assert.equal(classifyUpdate('1.2.3', '1.4.0'), 'minor')
  assert.equal(classifyUpdate('1.2.3', '2.0.0'), 'major')
  assert.equal(classifyUpdate('1.2.3', '1.2.3'), 'up_to_date')
  assert.equal(classifyUpdate('latest', null), 'unknown')
})
