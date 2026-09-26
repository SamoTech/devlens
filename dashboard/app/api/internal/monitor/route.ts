import { NextRequest, NextResponse } from 'next/server'
import { analyzeRepo } from '@/lib/scorer'
import { getRedis } from '@/lib/redis'
import { MONITOR_QUEUE_KEY, parseMonitorJob } from '@/lib/monitoring-queue.mjs'

export const dynamic = 'force-dynamic'
const BATCH_SIZE = 3
const MAX_ATTEMPTS = 2

function authorized(req: NextRequest) {
  const secret = process.env.MONITOR_CRON_SECRET || process.env.CRON_SECRET
  if (!secret) return false
  const header = req.headers.get('authorization') || ''
  return header === 'Bearer ' + secret
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const redis = getRedis()
  if (!redis) return NextResponse.json({ error: 'Monitoring queue is not configured' }, { status: 503 })
  const processed: any[] = []
  for (let i = 0; i < BATCH_SIZE; i++) {
    const raw = await redis.rpop(MONITOR_QUEUE_KEY)
    if (!raw) break
    let job = null
    try { job = parseMonitorJob(typeof raw === 'string' ? JSON.parse(raw) : raw) } catch { job = null }
    if (!job) { processed.push({ status: 'discarded' }); continue }
    const [owner, name] = job.repository.split('/')
    try {
      const report = await analyzeRepo(owner, name, process.env.GITHUB_TOKEN)
      processed.push({ repository: job.repository, event: job.event, healthScore: report.healthScore, status: 'analyzed' })
    } catch (error: any) {
      if (job.attempts < MAX_ATTEMPTS) await redis.lpush(MONITOR_QUEUE_KEY, JSON.stringify({ ...job, attempts: job.attempts + 1 }))
      processed.push({ repository: job.repository, event: job.event, status: 'failed', attempts: job.attempts + 1, error: error?.message || 'analysis failed' })
    }
  }
  return NextResponse.json({ ok: true, processed: processed.length, jobs: processed })
}