import test from 'node:test'
import assert from 'node:assert/strict'
import { verifyGithubSignature, repositoryFromPayload, installationFromPayload } from '../lib/github-webhook.mjs'

test('verifies the GitHub HMAC-SHA256 reference vector', () => {
  const secret = "It's a Secret to Everybody"
  const payload = 'Hello, World!'
  const signature = 'sha256=757107ea0eb2509fc211221cce984b8a37570b6d7586c22c46f4379c8b043e17'
  assert.equal(verifyGithubSignature(payload, signature, secret), true)
  assert.equal(verifyGithubSignature(payload + '!', signature, secret), false)
})

test('extracts repository and installation identifiers safely', () => {
  assert.equal(repositoryFromPayload({ repository: { full_name: 'SamoTech/devlens' } }), 'SamoTech/devlens')
  assert.equal(repositoryFromPayload({ repository: { full_name: 'invalid' } }), null)
  assert.equal(installationFromPayload({ installation: { id: 123 } }), 123)
  assert.equal(installationFromPayload({ installation: { id: '123' } }), null)
})
