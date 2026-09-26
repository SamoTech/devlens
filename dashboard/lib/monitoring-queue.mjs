const EVENTS = new Set(['push', 'pull_request', 'issues', 'issue_comment', 'release', 'workflow_run', 'repository'])
export const MONITOR_QUEUE_KEY = 'devlens:monitor:queue'

export function shouldQueueMonitorEvent(event, repository) {
  return Boolean(repository && EVENTS.has(event))
}

export function buildMonitorJob(repository, event, delivery) {
  if (!shouldQueueMonitorEvent(event, repository)) return null
  return { repository, event, delivery, queuedAt: new Date().toISOString() }
}

export function parseMonitorJob(value) {
  if (!value || typeof value !== 'object') return null
  if (typeof value.repository !== 'string' || !/^[^/]+\/[^/]+$/.test(value.repository)) return null
  return { repository: value.repository, event: String(value.event || 'unknown'), delivery: String(value.delivery || 'unknown'), queuedAt: String(value.queuedAt || '') }
}