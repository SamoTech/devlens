import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "DevLens — GitHub Repo Health Scorer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
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
        {/* Grid background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(99,102,241,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,.07) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            top: "-120px",
            left: "-80px",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,.25) 0%, transparent 70%)",
          }}
        />

        {/* Logo row */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", position: "relative" }}>
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="6" fill="#6366f1" />
            <circle cx="14" cy="14" r="6" fill="none" stroke="white" strokeWidth="2" />
            <circle cx="14" cy="14" r="2" fill="white" />
            <line x1="20" y1="20" x2="24" y2="24" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: "28px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.5px" }}>DevLens</span>
        </div>

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", position: "relative" }}>
          <div style={{ fontSize: "68px", fontWeight: 800, color: "#ffffff", lineHeight: 1.05, letterSpacing: "-2px" }}>
            Repo Health.
            <span style={{ color: "#6366f1" }}> In 7 Dimensions.</span>
          </div>
          <div style={{ fontSize: "26px", color: "#94a3b8", fontWeight: 400, lineHeight: 1.5, maxWidth: "740px" }}>
            Analyse any public GitHub repo and get an instant score out of 100. Free, no login, no data stored.
          </div>
        </div>

        {/* Bottom badges */}
        <div style={{ display: "flex", gap: "16px", position: "relative" }}>
          {["\u26a1 Live GitHub API", "\ud83d\udcca 7 Weighted Dimensions", "\ud83d\udee1\ufe0f Free Forever"].map((label) => (
            <div
              key={label}
              style={{
                background: "rgba(99,102,241,.15)",
                border: "1px solid rgba(99,102,241,.3)",
                borderRadius: "999px",
                padding: "10px 24px",
                fontSize: "18px",
                color: "#a5b4fc",
                fontWeight: 500,
              }}
            >
              {label}
            </div>
          ))}
          <div style={{ marginLeft: "auto", fontSize: "18px", color: "#475569", alignSelf: "center" }}>
            devlens-io.vercel.app
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
