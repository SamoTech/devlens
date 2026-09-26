import { createHmac, timingSafeEqual } from 'node:crypto'

export function verifyGithubSignature(payload, signature, secret) {
  if (!secret || !signature || !signature.startsWith('sha256=')) return false
  const expected = Buffer.from('sha256=' + createHmac('sha256', secret).update(payload).digest('hex'))
  const received = Buffer.from(signature)
  return expected.length === received.length && timingSafeEqual(expected, received)
}

export function repositoryFromPayload(payload) {
  const fullName = payload?.repository?.full_name
  if (typeof fullName !== 'string' || !/^[^/]+\/[^/]+$/.test(fullName)) return null
  return fullName
}

export function installationFromPayload(payload) {
  const id = payload?.installation?.id
  return Number.isInteger(id) ? id : null
}
