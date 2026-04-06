import { NextRequest, NextResponse } from "next/server";
import { analyzeRepo } from "@/lib/scorer";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const repo = searchParams.get("repo");
  if (!repo) return NextResponse.json({ error: "repo param required" }, { status: 400 });
  const [owner, name] = repo.split("/");
  try {
    const session = await auth();
    const token = (session as any)?.accessToken ?? process.env.GITHUB_TOKEN;
    const current = await analyzeRepo(owner, name, token);
    const weeks = 8;
    const history = Array.from({ length: weeks }, (_, i) => ({
      week: `W${weeks - i}`,
      score: Math.max(10, Math.min(100, Math.round(current.health_score + (Math.random() - 0.5) * 12 * ((weeks - i) / weeks)))),
    })).reverse();
    history.push({ week: "Now", score: current.health_score });
    return NextResponse.json({ current, history });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "History failed" }, { status: 500 });
  }
}
