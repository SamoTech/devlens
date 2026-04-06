import { NextRequest, NextResponse } from "next/server";
import { analyzeRepo } from "@/lib/scorer";
import { auth } from "@/lib/auth";
import { kv } from "@vercel/kv";

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

    // ── Analytics tracking (fire-and-forget) ──────────────────────────────
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";
    const ua = req.headers.get("user-agent") ?? "unknown";

    void Promise.all([
      // Total analyze count
      kv.incr("stats:total_analyses"),
      // Per-repo hit count
      kv.hincrby("stats:repo_hits", slug, 1),
      // Per-repo latest score
      kv.hset("stats:repo_scores", { [slug]: report.health_score }),
      // Daily activity counter
      kv.incr(`stats:daily:${today}`),
      // Unique IPs (capped set, ttl 90 days)
      kv.sadd("stats:unique_ips", ip),
      // Last seen per repo
      kv.hset("stats:repo_last_seen", { [slug]: new Date().toISOString() }),
    ]).catch(() => {});
    // ──────────────────────────────────────────────────────────────────────

    return NextResponse.json(report);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Analysis failed" }, { status: 500 });
  }
}
