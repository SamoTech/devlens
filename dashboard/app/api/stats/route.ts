import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export const revalidate = 60; // cache 60s

export async function GET() {
  try {
    const [
      totalAnalyses,
      repoHits,
      repoScores,
      repoLastSeen,
      uniqueIpCount,
    ] = await Promise.all([
      kv.get<number>("stats:total_analyses"),
      kv.hgetall<Record<string, number>>("stats:repo_hits"),
      kv.hgetall<Record<string, number>>("stats:repo_scores"),
      kv.hgetall<Record<string, string>>("stats:repo_last_seen"),
      kv.scard("stats:unique_ips"),
    ]);

    // Daily activity for the last 30 days
    const days: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    const dailyCounts = await Promise.all(
      days.map(d => kv.get<number>(`stats:daily:${d}`).then(v => ({ date: d, count: v ?? 0 })))
    );

    // Build top repos list
    const hits = repoHits ?? {};
    const scores = repoScores ?? {};
    const lastSeen = repoLastSeen ?? {};
    const topRepos = Object.entries(hits)
      .map(([slug, count]) => ({ slug, count, score: scores[slug] ?? null, lastSeen: lastSeen[slug] ?? null }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);

    return NextResponse.json({
      totalAnalyses: totalAnalyses ?? 0,
      uniqueVisitors: uniqueIpCount ?? 0,
      totalReposChecked: Object.keys(hits).length,
      topRepos,
      dailyActivity: dailyCounts,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
