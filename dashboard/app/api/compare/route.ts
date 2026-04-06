import { NextRequest, NextResponse } from 'next/server';
import { analyzeRepo } from '@/lib/analyzer';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const a = req.nextUrl.searchParams.get('a');
  const b = req.nextUrl.searchParams.get('b');
  if (!a || !b) return NextResponse.json({ error: 'Both a and b params required' }, { status: 400 });
  try {
    const [ra, rb] = await Promise.all([analyzeRepo(a), analyzeRepo(b)]);
    return NextResponse.json({ a: ra, b: rb }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 });
  }
}
