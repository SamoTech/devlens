"use client";
import { useState, useEffect } from "react";
import ScoreRing from "@/components/ScoreRing";
import Link from "next/link";

const FEATURED: { owner: string; name: string; category: string }[] = [
  { owner: "vercel",       name: "next.js",      category: "Framework" },
  { owner: "facebook",     name: "react",        category: "Framework" },
  { owner: "microsoft",    name: "vscode",       category: "Tool"      },
  { owner: "tailwindlabs", name: "tailwindcss",  category: "CSS"       },
  { owner: "supabase",     name: "supabase",     category: "Backend"   },
  { owner: "vitejs",       name: "vite",         category: "Build"     },
  { owner: "prisma",       name: "prisma",       category: "ORM"       },
  { owner: "trpc",         name: "trpc",         category: "API"       },
  { owner: "SamoTech",     name: "devlens",      category: "DevOps"    },
];

const CATEGORIES = ["All", ...Array.from(new Set(FEATURED.map(r => r.category)))];

type Row = { owner: string; name: string; category: string; score: number | null; loading: boolean };

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>(FEATURED.map(r => ({ ...r, score: null, loading: true })));
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    rows.forEach((r, i) => {
      fetch(`/api/analyze?repo=${r.owner}/${r.name}`)
        .then(res => res.json())
        .then(data => setRows(prev => prev.map((row, idx) => idx === i ? { ...row, score: data.health_score ?? 0, loading: false } : row)))
        .catch(() => setRows(prev => prev.map((row, idx) => idx === i ? { ...row, score: 0, loading: false } : row)));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = [...rows]
    .filter(r => filter === "All" || r.category === filter)
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

  return (
    <main style={{ maxWidth: "800px", margin: "0 auto", padding: "var(--space-10) var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
      <div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 800 }}>🏆 Leaderboard</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", marginTop: "var(--space-1)" }}>Top repos ranked by DevLens health score</p>
      </div>

      {/* Category filter */}
      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            style={{ padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-full)", fontSize: "var(--text-xs)", fontWeight: 600,
              background: filter === cat ? "var(--accent)" : "var(--surface-off)",
              color: filter === cat ? "#fff" : "var(--text-muted)", border: "none", cursor: "pointer" }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {sorted.map((r, i) => {
          const score = r.score ?? 0;
          const color = score >= 80 ? "var(--success)" : score >= 50 ? "var(--warning)" : "var(--danger)";
          return (
            <Link key={`${r.owner}/${r.name}`} href={`/repo/${r.owner}/${r.name}`}
              style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", background: "var(--surface-off)",
                borderRadius: "var(--radius-lg)", padding: "var(--space-4) var(--space-5)", textDecoration: "none",
                color: "var(--text)", transition: "background .15s" }}>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-faint)", minWidth: "24px" }}>#{i + 1}</span>
              <ScoreRing score={r.loading ? 0 : score} size={44} />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: "var(--text-sm)" }}>{r.owner}/{r.name}</p>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{r.category}</p>
              </div>
              {r.loading
                ? <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>analyzing…</span>
                : <span style={{ fontSize: "var(--text-xl)", fontWeight: 900, color }}>{score}</span>}
            </Link>
          );
        })}
      </div>
    </main>
  );
}
