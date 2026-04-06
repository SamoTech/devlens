import { NextRequest, NextResponse } from "next/server";
import { analyzeRepo } from "@/lib/scorer";
import { auth } from "@/lib/auth";

type Params = { params: Promise<{ owner: string; name: string }> };

function scoreColor(score: number): string {
  if (score >= 80) return "4c9a2a"; // green
  if (score >= 60) return "e6a817"; // yellow
  if (score >= 40) return "d97706"; // orange
  return "dc2626";                  // red
}

function buildSvg(owner: string, name: string, score: number): string {
  const label = "DevLens";
  const value = `${score}/100`;
  const color = scoreColor(score);
  const lw = 68;
  const vw = 52;
  const tw = lw + vw;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tw}" height="20" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${tw}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${lw}" height="20" fill="#555"/>
    <rect x="${lw}" width="${vw}" height="20" fill="#${color}"/>
    <rect width="${tw}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="110">
    <text x="${Math.round(lw / 2) * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(lw - 10) * 10}" lengthAdjust="spacing">${label}</text>
    <text x="${Math.round(lw / 2) * 10}" y="140" transform="scale(.1)" textLength="${(lw - 10) * 10}" lengthAdjust="spacing">${label}</text>
    <text x="${(lw + Math.round(vw / 2)) * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(vw - 10) * 10}" lengthAdjust="spacing">${value}</text>
    <text x="${(lw + Math.round(vw / 2)) * 10}" y="140" transform="scale(.1)" textLength="${(vw - 10) * 10}" lengthAdjust="spacing">${value}</text>
  </g>
</svg>`;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { owner, name } = await params;
  let score = 0;
  try {
    const session = await auth();
    const token = (session as any)?.accessToken ?? process.env.GITHUB_TOKEN;
    const report = await analyzeRepo(owner, name, token);
    score = report.health_score ?? 0;
  } catch { /* return 0-score badge on error */ }

  const svg = buildSvg(owner, name, score);
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
