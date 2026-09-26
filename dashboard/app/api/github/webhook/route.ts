import { NextRequest, NextResponse } from 'next/server'
import { getRedis } from '@/lib/redis'
import { verifyGithubSignature, repositoryFromPayload, installationFromPayload } from '@/lib/github-webhook.mjs'

export const dynamic = 'force-dynamic'

const INVALIDATION_KEYS = (fullName: string) => {
  const [owner, repo] = fullName.split('/')
  return [
    `cache:${owner}:${repo}`,
    `security:${owner}:${repo}`,
    `devlens:security:v3:${owner}/${repo}`,
    `advisory:${owner}:${repo}`,
    `dependencies:${owner}:${repo}`,
  ]
}

export async function POST(req: NextRequest) {
  const secret = process.env.GITHUB_APP_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'GitHub App webhook is not configured' }, { status: 503 })

  const body = await req.text()
  const signature = req.headers.get('x-hub-signature-256')
  if (!verifyGithubSignature(body, signature, secret)) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
  }

  const event = req.headers.get('x-github-event') ?? 'unknown'
  const delivery = req.headers.get('x-github-delivery') ?? 'unknown'
  const payload = JSON.parse(body)
  const redis = getRedis()

  if (redis && delivery !== 'unknown') {
    const key = `github:webhook:delivery:${delivery}`
    const first = await redis.set(key, '1', { nx: true, ex: 86400 })
    if (first === null) {
      return NextResponse.json({ ok: true, duplicate: true })
    }
  }

  const installationId = installationFromPayload(payload)
  if (redis && installationId && (event === 'installation' || event === 'installation_repositories')) {
    const action = payload.action
    if (action === 'deleted' || action === 'suspend') {
      await redis.del(`github:app:installation:${installationId}`)
    } else {
      await redis.set(`github:app:installation:${installationId}`, JSON.stringify({
        installationId,
        account: payload.installation?.account?.login ?? null,
        repositories: (payload.repositories ?? []).map((repo: any) => repo.full_name).filter(Boolean),
        updatedAt: new Date().toISOString(),
      }), { ex: 86400 * 30 })
    }
  }

  const repo = repositoryFromPayload(payload)
  if (redis && repo && ['push', 'pull_request', 'issues', 'issue_comment', 'release', 'workflow_run', 'repository'].includes(event)) {
    await Promise.all(INVALIDATION_KEYS(repo).map(key => redis.del(key)))
  }

  return NextResponse.json({
    ok: true,
    event,
    delivery,
    installationId,
    repository: repo,
  })
}
