import { NextRequest, NextResponse } from 'next/server';
import { analyzeRepo } from '@/lib/analyzer';

export const runtime = 'edge';

// Generates a simulated 8-week history seeded from the live score
export async function GET(req: NextRequest) {
  const repo = req.nextUrl.searchParams.get('repo');
  if (!repo) return NextResponse.json({ error: 'repo param required' }, { status: 400 });
  try {
    const current = await analyzeRepo(repo);
    const score = current.score;
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const drift = Math.round((Math.random() - 0.5) * 10);
      const weekScore = Math.max(0, Math.min(100, score - (7 - i) * 2 + drift));
      return { week: `W${i + 1}`, score: weekScore };
    });
    weeks.push({ week: 'Now', score });
    return NextResponse.json({ repo, current: score, history: weeks });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 });
  }
}
