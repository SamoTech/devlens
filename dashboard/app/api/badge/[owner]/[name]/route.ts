import { NextRequest, NextResponse } from "next/server";
import { analyzeRepo } from "@/lib/scorer";

type Params = { params: Promise<{ owner: string; name: string }> };

function scoreColor(score: number): string {
  if (score >= 80) return "4c9a2a";
  if (score >= 60) return "e6a817";
  if (score >= 40) return "d97706";
  return "dc2626";
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&apos;",
    };
    return entities[char];
  });
}

function buildSvg(value: string, color: string): string {
  const label = "DevLens";
  const safeValue = escapeXml(value);
  const lw = 68;
  const vw = Math.max(52, Math.min(110, safeValue.length * 7 + 14));
  const tw = lw + vw;
  const labelX = Math.round(lw / 2) * 10;
  const valueX = (lw + Math.round(vw / 2)) * 10;
  const labelLength = (lw - 10) * 10;
  const valueLength = (vw - 10) * 10;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tw}" height="20" role="img" aria-label="${label}: ${safeValue}">
  <title>${label}: ${safeValue}</title>
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
    <text x="${labelX}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${labelLength}" lengthAdjust="spacing">${label}</text>
    <text x="${labelX}" y="140" transform="scale(.1)" textLength="${labelLength}" lengthAdjust="spacing">${label}</text>
    <text x="${valueX}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${valueLength}" lengthAdjust="spacing">${safeValue}</text>
    <text x="${valueX}" y="140" transform="scale(.1)" textLength="${valueLength}" lengthAdjust="spacing">${safeValue}</text>
  </g>
</svg>`;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { owner, name } = await params;

  try {
    const report = await analyzeRepo(owner, name, process.env.GITHUB_TOKEN);
    const score = report.healthScore;

    if (!Number.isFinite(score) || score < 0 || score > 100) {
      throw new Error("Analysis returned an invalid health score");
    }

    return new NextResponse(buildSvg(`${score}/100`, scoreColor(score)), {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return new NextResponse(buildSvg("unavailable", "6b7280"), {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}
