import { NextRequest, NextResponse } from "next/server";
import { analyzeRepo } from "@/lib/scorer";
import { auth } from "@/lib/auth";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const repo = searchParams.get("repo");
  if (!repo) return NextResponse.json({ error: "repo param required" }, { status: 400 });
  const parts = repo.replace("https://github.com/", "").replace(/\/+$/, "").split("/");
  if (parts.length < 2) return NextResponse.json({ error: "Invalid repo format. Use owner/name" }, { status: 400 });
  const [owner, name] = parts;
  const slug = `${owner}/${name}`;

  try {
    const session = await auth();
    const token = (session as any)?.accessToken ?? process.env.GITHUB_TOKEN;
    const report = await analyzeRepo(owner, name, token);

    // ── Analytics tracking (fire-and-forget) ──
    const today = new Date().toISOString().slice(0, 10);
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    void Promise.all([
      redis.incr("stats:total_analyses"),
      redis.hincrby("stats:repo_hits", slug, 1),
      redis.hset("stats:repo_scores", { [slug]: report.health_score }),
      redis.incr(`stats:daily:${today}`),
      redis.sadd("stats:unique_ips", ip),
      redis.hset("stats:repo_last_seen", { [slug]: new Date().toISOString() }),
    ]).catch(() => {});
    // ─────────────────────────────

    return NextResponse.json(report);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Analysis failed" }, { status: 500 });
  }
}
