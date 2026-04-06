import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TIER = (s: number) =>
  s >= 90 ? { label: "Excellent", color: "#22c55e" }
  : s >= 75 ? { label: "Good",      color: "#86efac" }
  : s >= 60 ? { label: "Fair",      color: "#facc15" }
  : s >= 40 ? { label: "Needs Work",color: "#f97316" }
  :           { label: "Critical",  color: "#ef4444" };

export default async function RepoOGImage({
  params,
}: {
  params: { owner: string; repo: string };
}) {
  const slug = `${params.owner}/${params.repo}`;
  let score: number | null = null;
  let description = "";
  let language = "";

  try {
    const res = await fetch(
      `https://devlens-io.vercel.app/api/analyze?repo=${encodeURIComponent(slug)}`,
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const d = await res.json();
      score = d.health_score ?? null;
      description = d.description ?? "";
      language = d.language ?? "";
    }
  } catch {}

  const tier = score !== null ? TIER(score) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0f1117",
          padding: "64px 72px",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(99,102,241,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.06) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            top: "-140px",
            right: "-100px",
            width: "560px",
            height: "560px",
            borderRadius: "50%",
            background: tier
              ? `radial-gradient(circle, ${tier.color}22 0%, transparent 70%)`
              : "radial-gradient(circle, rgba(99,102,241,.18) 0%, transparent 70%)",
          }}
        />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", position: "relative" }}>
          <svg width="40" height="40" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="6" fill="#6366f1" />
            <circle cx="14" cy="14" r="6" fill="none" stroke="white" strokeWidth="2" />
            <circle cx="14" cy="14" r="2" fill="white" />
            <line x1="20" y1="20" x2="24" y2="24" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: "22px", fontWeight: 800, color: "#94a3b8" }}>DevLens</span>
        </div>

        {/* Repo + score */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px", position: "relative" }}>
          <div style={{ fontSize: "20px", color: "#6366f1", fontWeight: 600 }}>github.com/{slug}</div>
          <div style={{ fontSize: "62px", fontWeight: 800, color: "#ffffff", letterSpacing: "-2px", lineHeight: 1.05 }}>
            {params.owner}/<span style={{ color: "#6366f1" }}>{params.repo}</span>
          </div>
          {description && (
            <div style={{ fontSize: "22px", color: "#94a3b8", maxWidth: "680px", lineHeight: 1.5 }}>
              {description.length > 100 ? description.slice(0, 100) + "…" : description}
            </div>
          )}
        </div>

        {/* Bottom row */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px", position: "relative" }}>
          {score !== null && tier && (
            <>
              <div
                style={{
                  fontSize: "72px",
                  fontWeight: 900,
                  color: tier.color,
                  letterSpacing: "-3px",
                  lineHeight: 1,
                }}
              >
                {score}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ fontSize: "16px", color: "#475569", fontWeight: 500 }}>Health Score</div>
                <div
                  style={{
                    background: `${tier.color}22`,
                    border: `1px solid ${tier.color}55`,
                    borderRadius: "999px",
                    padding: "4px 16px",
                    fontSize: "17px",
                    color: tier.color,
                    fontWeight: 700,
                  }}
                >
                  {tier.label}
                </div>
              </div>
            </>
          )}
          {language && (
            <div
              style={{
                marginLeft: score !== null ? "0" : "0",
                background: "rgba(99,102,241,.12)",
                border: "1px solid rgba(99,102,241,.25)",
                borderRadius: "999px",
                padding: "8px 20px",
                fontSize: "18px",
                color: "#a5b4fc",
              }}
            >
              {language}
            </div>
          )}
          <div style={{ marginLeft: "auto", fontSize: "17px", color: "#334155" }}>devlens-io.vercel.app</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
