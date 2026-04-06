import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import type { WatchEntry } from "@/app/api/watchlist/route";
import type { OrgEntry } from "@/app/api/org-watchlist/route";

const redis = Redis.fromEnv();

export const revalidate = 60;

export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const [
      totalAnalyses,
      repoHits,
      repoScores,
      repoLastSeen,
      uniqueIpCount,
      analysesToday,
      watchlist,
      orgWatchlist,
    ] = await Promise.all([
      redis.get<number>("stats:total_analyses"),
      redis.hgetall("stats:repo_hits"),
      redis.hgetall("stats:repo_scores"),
      redis.hgetall("stats:repo_last_seen"),
      redis.scard("stats:unique_ips"),
      redis.get<number>(`stats:daily:${today}`),
      redis.lrange<WatchEntry>("devlens:watchlist", 0, 99),
      redis.lrange<OrgEntry>("devlens:org-watchlist", 0, 99),
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

    // Avg score from watchlist
    const wl = (watchlist ?? []).filter(e => e && typeof e.score === "number");
    const avgScore = wl.length > 0
      ? Math.round(wl.reduce((s, e) => s + e.score, 0) / wl.length)
      : null;

    // Top language from watchlist
    const langCounts: Record<string, number> = {};
    for (const e of wl) {
      if (e.language) langCounts[e.language] = (langCounts[e.language] ?? 0) + 1;
    }
    const topLanguage = Object.entries(langCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    // Org stats
    const ol = (orgWatchlist ?? []).filter(e => e && e.org);
    const totalOrgsChecked = ol.length;
    const topOrgs = [...ol].slice(0, 20);

    return NextResponse.json({
      totalAnalyses: totalAnalyses ?? 0,
      uniqueVisitors: uniqueIpCount ?? 0,
      totalReposChecked: Object.keys(hits).length,
      analysesToday: analysesToday ?? 0,
      avgScore,
      topLanguage,
      totalOrgsChecked,
      topRepos,
      topOrgs,
      dailyActivity: dailyCounts,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
