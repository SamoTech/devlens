import { NextRequest } from 'next/server'
import { GET as sourceGET } from '@/app/api/security/route'
import { proxyV2 } from '@/lib/api-v2-proxy.mjs'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return proxyV2(request, sourceGET, 'security')
}
