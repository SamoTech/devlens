import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Changelog | DevLens" };

type Release = {
  version: string;
  date: string;
  tag?: string;
  sections: { label: string; items: string[] }[];
};

const releases: Release[] = [
  {
    version: "v0.4.0",
    date: "April 2026",
    tag: "Latest",
    sections: [
      {
        label: "New",
        items: [
          "Expanded to 9 scoring dimensions: added PR Velocity and Security",
          "Adjustable weight sliders — redistribute importance across all 9 dims before analyzing",
          "Org analysis page (/org) — scores up to 30 public repos concurrently and ranks by health",
          "Leaderboard page (/leaderboard) — top-scoring repos from all DevLens users",
          "Checked page (/checked) — full searchable list of recently analyzed repos with scores",
          "Stats page (/stats) — live usage counters: total analyses, unique visitors, top repos, daily activity chart",
          "Badge page (/badge) — live shields.io badge generator with copy-paste markdown",
          "Recently Checked and Recently Checked Orgs panels on home page",
          "Repo detail pages (/repo/owner/name) — permanent shareable report URLs",
          "Docs page fully rewritten with 9-dimension scoring table, real API shapes, self-hosting guide",
        ],
      },
      {
        label: "Improved",
        items: [
          "Redis (Upstash) integration: watchlist, org-watchlist, history snapshots, stats counters, 15-min cache",
          "History is now live data from Redis, not simulated — trend chart shows real weekly snapshots",
          "/api/analyze now writes to watchlist and history on every uncached run",
          "Custom-weight runs bypass the Redis cache for a fresh score",
          "Watchlist POST correctly uses healthScore field (was reading undefined .score)",
          "Suggestions panel: actionable tips for every dimension scoring below 80",
          "Score color thresholds: green ≥80 / amber ≥50 / red <50 applied consistently everywhere",
        ],
      },
      {
        label: "Fixed",
        items: [
          "page.tsx was saving score: undefined to watchlist (data.score → data.healthScore)",
          "/checked showed empty or stale entries because analyze never wrote to Redis",
          "Docs page referenced 7 dimensions, simulated history, and missing API endpoints",
          "Changelog v0.1.0 incorrectly stated 7-dimension scoring",
        ],
      },
    ],
  },
  {
    version: "v0.3.0",
    date: "April 2026",
    sections: [
      {
        label: "New",
        items: [
          "Shared Nav and Footer components across all pages",
          "New pages: About, FAQ, Terms, Privacy, Cookies, Sponsor, Docs, Changelog",
          "sitemap.ts and robots.ts for SEO indexing",
          "README badge: hero badges added to home page analyze block",
          "Feature badges row (Live GitHub API · 9 weighted dimensions · Free forever)",
          "CTA buttons (Star on GitHub · Read the Docs) below the analyze block",
        ],
      },
      {
        label: "Fixed",
        items: [
          "NextAuth v5 route handler exports for Next.js 15 compatibility",
          "Upgraded Next.js to 15.3.6 (patches CVE-2025-66478)",
        ],
      },
    ],
  },
  {
    version: "v0.2.0",
    date: "April 2026",
    sections: [
      {
        label: "Fixed",
        items: [
          "Restored original dashboard from commit 643acc5",
          "Fixed PostCSS config conflict (removed stale tailwind reference)",
          "Upgraded Next.js from 15.2.4 to 15.3.1",
        ],
      },
    ],
  },
  {
    version: "v0.1.0",
    date: "April 2026",
    sections: [
      {
        label: "New",
        items: [
          "Initial release: live GitHub API scoring across 7 dimensions (README, Activity, Freshness, Docs, CI, Issues, Community)",
          "Animated ScoreRing, DimBar progress bars, TrendChart",
          "Dark/light mode with system preference detection and manual toggle",
          "Compare two repos side by side (/compare)",
          "Copy-paste snippet modal for README integration",
          "Rate-limit detection with Sign in with GitHub prompt",
        ],
      },
    ],
  },
];

const LABEL_COLORS: Record<string, { bg: string; color: string }> = {
  New:      { bg: "color-mix(in oklch, var(--primary) 12%, transparent)",  color: "var(--primary)" },
  Improved: { bg: "color-mix(in oklch, var(--warning) 12%, transparent)",  color: "var(--warning)" },
  Fixed:    { bg: "color-mix(in oklch, var(--success, #437a22) 12%, transparent)", color: "var(--success, #437a22)" },
};

export default function ChangelogPage() {
  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "var(--space-16) var(--space-6)" }}>
      <p style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)", marginBottom: "var(--space-4)" }}>
        <Link href="/" style={{ color: "var(--primary)", textDecoration: "none" }}>← Home</Link>
      </p>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 800, marginBottom: "var(--space-2)" }}>Changelog</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "var(--space-10)", fontSize: "var(--text-sm)" }}>All notable changes to DevLens, newest first.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0", borderLeft: "2px solid var(--divider)", paddingLeft: "var(--space-6)" }}>
        {releases.map(r => (
          <div key={r.version} style={{ position: "relative", paddingBottom: "var(--space-10)" }}>
            {/* Timeline dot */}
            <div style={{
              position: "absolute",
              left: "calc(-1 * var(--space-6) - 5px)",
              top: "6px",
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: r.tag ? "var(--primary)" : "var(--border)",
              transform: "translateX(-50%)",
            }} />

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-5)", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--text-base)" }}>{r.version}</span>
              {r.tag && (
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, background: "var(--primary-hl)", color: "var(--primary)", padding: "2px var(--space-2)", borderRadius: "var(--radius-full)" }}>
                  {r.tag}
                </span>
              )}
              <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>{r.date}</span>
            </div>

            {/* Sections */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
              {r.sections.map(s => (
                <div key={s.label}>
                  <span style={{
                    display: "inline-block",
                    fontSize: "var(--text-xs)",
                    fontWeight: 700,
                    marginBottom: "var(--space-2)",
                    padding: "2px var(--space-2)",
                    borderRadius: "var(--radius-full)",
                    background: LABEL_COLORS[s.label]?.bg ?? "var(--surface)",
                    color: LABEL_COLORS[s.label]?.color ?? "var(--text-muted)",
                  }}>
                    {s.label}
                  </span>
                  <ul style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", paddingLeft: "var(--space-4)" }}>
                    {s.items.map(c => (
                      <li key={c} style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", listStyleType: "disc", lineHeight: 1.7 }}>{c}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
