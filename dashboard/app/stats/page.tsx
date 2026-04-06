"use client";
import { useState, useEffect } from "react";
import { Loader2, BarChart2, Users, GitFork, Zap, ExternalLink } from "lucide-react";
import Link from "next/link";

interface StatsData {
  totalAnalyses: number;
  uniqueVisitors: number;
  totalReposChecked: number;
  topRepos: { slug: string; count: number; score: number | null; lastSeen: string | null }[];
  dailyActivity: { date: string; count: number }[];
}

export default function StatsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const scoreColor = (s: number | null) =>
    s === null ? "var(--text-faint)"
    : s >= 80 ? "var(--success)"
    : s >= 50 ? "var(--warning)"
    : "var(--danger)";

  const maxDaily = data ? Math.max(...data.dailyActivity.map(d => d.count), 1) : 1;

  return (
    <main style={{ maxWidth: "860px", margin: "0 auto", padding: "var(--space-10) var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>

      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        <p style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>
          <Link href="/" style={{ color: "var(--primary)", textDecoration: "none" }}>← Home</Link>
        </p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 800 }}>Usage Stats</h1>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>Live usage across all DevLens visitors — refreshes every 60 seconds.</p>
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--text-faint)" }}>
          <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Loading stats…
        </div>
      )}

      {data && (
        <>
          {/* KPI cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(200px,100%),1fr))", gap: "var(--space-4)" }}>
            {[
              { icon: <Zap size={18} />,      label: "Total Analyses",     value: data.totalAnalyses.toLocaleString() },
              { icon: <Users size={18} />,     label: "Unique Visitors",    value: data.uniqueVisitors.toLocaleString() },
              { icon: <GitFork size={18} />,   label: "Repos Checked",      value: data.totalReposChecked.toLocaleString() },
              { icon: <BarChart2 size={18} />, label: "Analyses Today",     value: (data.dailyActivity.at(-1)?.count ?? 0).toLocaleString() },
            ].map(k => (
              <div key={k.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <div style={{ color: "var(--primary)" }}>{k.icon}</div>
                <div style={{ fontSize: "var(--text-2xl)", fontWeight: 800, fontFamily: "var(--font-display)" }}>{k.value}</div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Daily activity bar chart */}
          <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-base)", fontWeight: 800 }}>Daily Activity — Last 30 Days</h2>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "80px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "var(--space-3)" }}>
              {data.dailyActivity.map(d => (
                <div
                  key={d.date}
                  title={`${d.date}: ${d.count} analyses`}
                  style={{
                    flex: 1,
                    background: d.count > 0 ? "var(--primary)" : "var(--border)",
                    borderRadius: "2px 2px 0 0",
                    height: `${Math.max((d.count / maxDaily) * 100, d.count > 0 ? 6 : 2)}%`,
                    opacity: d.count > 0 ? 0.85 : 0.3,
                    cursor: "default",
                    transition: "opacity .15s",
                  }}
                />
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>
              <span>{data.dailyActivity[0]?.date}</span>
              <span>{data.dailyActivity.at(-1)?.date}</span>
            </div>
          </section>

          {/* Top repos table */}
          <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-base)", fontWeight: 800 }}>Most Analysed Repos</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {data.topRepos.length === 0 && (
                <p style={{ fontSize: "var(--text-sm)", color: "var(--text-faint)" }}>No data yet — analyse a repo to start tracking.</p>
              )}
              {data.topRepos.map((r, i) => (
                <div key={r.slug} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "var(--space-3) var(--space-4)" }}>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)", minWidth: "20px", textAlign: "right", fontWeight: 700 }}>#{i + 1}</span>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <Link href={`/?repo=${r.slug}`} style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--text)", textDecoration: "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                      {r.slug}
                    </Link>
                    {r.lastSeen && (
                      <p style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)", margin: 0 }}>
                        Last checked {new Date(r.lastSeen).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)", flexShrink: 0 }}>{r.count}×</span>
                  {r.score !== null && (
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: 800, color: scoreColor(r.score), minWidth: "32px", textAlign: "center" }}>{r.score}</span>
                  )}
                  <a href={`/repo/${r.slug}`} style={{ color: "var(--text-faint)", display: "flex", flexShrink: 0 }} title="Full report">
                    <ExternalLink size={14} />
                  </a>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  );
}
