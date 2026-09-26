import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.json({
    data: {
      version: 'v2',
      envelope: {
        success: '{ data, error: null, meta }',
        failure: '{ data: null, error: { code, message }, meta }',
      },
      resources: {
        health: '/api/v2/health?repo=owner/name',
        security: '/api/v2/security?repo=owner/name',
        dependencies: '/api/v2/dependencies?repo=owner/name',
        pullRequest: '/api/v2/pr?repo=owner/name&number=123',
      },
      compatibility: 'v1 endpoints remain available',
    },
    error: null,
    meta: { apiVersion: 'v2', resource: 'api', generatedAt: new Date().toISOString() },
  })
}
