import { NextRequest, NextResponse } from 'next/server'
import { normalizeV2Error } from '@/lib/api-v2.mjs'

export async function proxyV2(request: NextRequest, handler: (request: NextRequest) => Promise<NextResponse>, resource: string) {
  const response = await handler(request)
  const raw = await response.text()
  let body: any = null
  try { body = raw ? JSON.parse(raw) : null } catch { body = { error: raw } }

  const meta = {
    apiVersion: 'v2',
    resource,
    generatedAt: new Date().toISOString(),
    requestId: request.headers.get('x-request-id') ?? null,
  }

  if (!response.ok) {
    return NextResponse.json({ data: null, error: normalizeV2Error(body), meta }, { status: response.status })
  }

  return NextResponse.json({ data: body, error: null, meta }, { status: response.status })
}
