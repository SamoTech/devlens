import { NextRequest, NextResponse } from 'next/server';
import { analyzeRepo } from '@/lib/analyzer';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const repo = req.nextUrl.searchParams.get('repo');
  if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    return NextResponse.json({ error: 'Invalid repo format. Use owner/repo' }, { status: 400 });
  }
  try {
    const result = await analyzeRepo(repo);
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Analysis failed';
    const status = msg.includes('Not Found') ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
