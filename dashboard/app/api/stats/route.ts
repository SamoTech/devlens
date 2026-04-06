import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export const revalidate = 60;

export async function GET() {
  try {
    const [
      totalAnalyses,
      repoHits,
      repoScores,
      repoLastSeen,
      uniqueIpCount,
    ] = await Promise.all([
      redis.get<number>("stats:total_analyses"),
      redis.hgetall("stats:repo_hits"),
      redis.hgetall("stats:repo_scores"),
      redis.hgetall("stats:repo_last_seen"),
      redis.scard("stats:unique_ips"),
    ]);

    // Daily activity for the last 30 days
    const days: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    const dailyCounts = await Promise.all(
      days.map(d =>
        redis.get<number>(`stats:daily:${d}`).then(v => ({ date: d, count: v ?? 0 }))
      )
    );

    const hits = (repoHits ?? {}) as Record<string, number>;
    const scores = (repoScores ?? {}) as Record<string, number>;
    const lastSeen = (repoLastSeen ?? {}) as Record<string, string>;

    const topRepos = Object.entries(hits)
      .map(([slug, count]) => ({
        slug,
        count: Number(count),
        score: scores[slug] != null ? Number(scores[slug]) : null,
        lastSeen: lastSeen[slug] ?? null,
      }))
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
