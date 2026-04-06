import { NextRequest, NextResponse } from "next/server";
import { analyzeRepo } from "@/lib/scorer";
import { auth } from "@/lib/auth";
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const repo = searchParams.get("repo");
  if (!repo) return NextResponse.json({ error: "repo param required" }, { status: 400 });
  const parts = repo.replace("https://github.com/", "").replace(/\/+$/, "").split("/");
  if (parts.length < 2) return NextResponse.json({ error: "Invalid repo format. Use owner/name" }, { status: 400 });
  const [owner, name] = parts;
  try {
    const session = await auth();
    const token = (session as any)?.accessToken ?? process.env.GITHUB_TOKEN;
    const report = await analyzeRepo(owner, name, token);
    return NextResponse.json(report);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Analysis failed" }, { status: 500 });
  }
}