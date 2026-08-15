import test from 'node:test'
import assert from 'node:assert/strict'
import { parseRepoSlug } from '../lib/repo-validation.mjs'
import { sanitizeWeights } from '../lib/weights.mjs'

const defaults = { readme: 0.2, activity: 0.2, security: 0.6 }

test('accepts owner/name and canonical GitHub HTTPS URLs', () => {
  assert.deepEqual(parseRepoSlug('SamoTech/devlens'), {
    owner: 'SamoTech', name: 'devlens', slug: 'SamoTech/devlens',
  })
  assert.deepEqual(parseRepoSlug('https://github.com/SamoTech/devlens/'), {
    owner: 'SamoTech', name: 'devlens', slug: 'SamoTech/devlens',
  })
})

test('rejects non-GitHub, ambiguous, and control-character repository inputs', () => {
  for (const value of [
    '', 'owner', 'owner/name/extra', 'http://github.com/owner/name',
    'https://example.com/owner/name', 'https://github.com/owner/name?x=1',
    'https://github.com/owner/name#fragment', 'owner/name\u0000', '//github.com/owner/name',
  ]) assert.equal(parseRepoSlug(value), null, value)
})

test('keeps only finite known weights and falls back when their sum is invalid', () => {
  assert.deepEqual(sanitizeWeights({ readme: 0.5, activity: 0.25, security: 0.25, extra: 1 }, defaults), {
    readme: 0.5, activity: 0.25, security: 0.25,
  })
  assert.deepEqual(sanitizeWeights({ readme: 0, activity: 0, security: 0 }, defaults), defaults)
  assert.deepEqual(sanitizeWeights({ readme: Number.NaN, activity: -1, security: 2 }, defaults), defaults)
})
