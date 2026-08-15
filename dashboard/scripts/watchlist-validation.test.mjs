import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeOrgEntry, normalizeWatchEntry } from '../lib/watchlist-validation.mjs'

test('normalizes a valid repository watch entry and bounds score/content', () => {
  const entry = normalizeWatchEntry({
    slug: 'https://github.com/SamoTech/devlens/',
    score: 120.4,
    description: 'x'.repeat(600),
    language: 'TypeScript',
  })
  assert.equal(entry.slug, 'SamoTech/devlens')
  assert.equal(entry.score, 100)
  assert.equal(entry.description.length, 500)
  assert.equal(entry.language, 'TypeScript')
  assert.ok(entry.savedAt)
})

test('rejects malformed repository watch entries', () => {
  assert.equal(normalizeWatchEntry({ slug: 'https://example.com/a/b' }), null)
  assert.equal(normalizeWatchEntry({ slug: 'owner/name/extra' }), null)
  assert.equal(normalizeWatchEntry(null), null)
})

test('normalizes organization entries and rejects malformed organizations', () => {
  const entry = normalizeOrgEntry({ org: 'SamoTech', repoCount: 99, avgScore: -2, topRepo: 'SamoTech/devlens' })
  assert.deepEqual({ org: entry.org, repoCount: entry.repoCount, avgScore: entry.avgScore, topRepo: entry.topRepo }, {
    org: 'SamoTech', repoCount: 30, avgScore: 0, topRepo: 'SamoTech/devlens',
  })
  assert.equal(normalizeOrgEntry({ org: 'bad org' }), null)
  assert.equal(normalizeOrgEntry({ org: 'a/'.repeat(30) }), null)
})
