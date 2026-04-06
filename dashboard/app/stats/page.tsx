"use client";
import { useState, useEffect, useRef } from "react";
import { Loader2, BarChart2, Users, GitFork, Zap, ExternalLink, Star, Code2, Building2, TrendingUp } from "lucide-react";
import Link from "next/link";

interface StatsData {
  totalAnalyses: number;
  uniqueVisitors: number;
  totalReposChecked: number;
  analysesToday: number;
  avgScore: number | null;
  topLanguage: string | null;
  totalOrgsChecked: number;
  topRepos: { slug: string; count: number; score: number | null; lastSeen: string | null }[];
  topOrgs: { org: string; repoCount: number; avgScore: number; topRepo: string | null; savedAt: string }[];
  dailyActivity: { date: string; count: number }[];
}

export default function StatsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{ text: string; x: number } | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/stats")
        .then(r => r.json())
        .then(setData)
        .catch(() => {})
        .finally(() => setLoading(false));
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  const scoreColor = (s: number | null) =>
    s === null ? "var(--text-faint)" : s >= 80 ? "var(--success)" : s >= 50 ? "var(--warning)" : "var(--danger)";

  const maxDaily = data ? Math.max(...data.dailyActivity.map(d => d.count), 1) : 1;

  const kpis = data ? [
    { icon: <Zap size={18} />,        label: "Total Analyses",   value: data.totalAnalyses.toLocaleString(),                                          sub: "all time" },
    { icon: <TrendingUp size={18} />, label: "Analyses Today",   value: data.analysesToday.toLocaleString(),                                           sub: "since midnight UTC" },
    { icon: <Users size={18} />,      label: "Unique Visitors",  value: data.uniqueVisitors.toLocaleString(),                                          sub: "by IP" },
    { icon: <GitFork size={18} />,    label: "Repos Checked",    value: data.totalReposChecked.toLocaleString(),                                       sub: "unique repos" },
    { icon: <Building2 size={18} />,  label: "Orgs Checked",     value: data.totalOrgsChecked.toLocaleString(),                                        sub: "organizations" },
    { icon: <Star size={18} />,       label: "Avg Health Score", value: data.avgScore !== null ? `${data.avgScore}/100` : "—",                        sub: "across watchlist" },
    { icon: <Code2 size={18} />,      label: "Top Language",     value: data.topLanguage ?? "—",                                                      sub: "most checked repos" },
    { icon: <BarChart2 size={18} />,  label: "Peak Day",         value: (Math.max(...data.dailyActivity.map(d => d.count)) || 0).toLocaleString(),    sub: "analyses in one day" },
  ] : [];

  return (
    <main style={{ maxWidth: "960px", margin: "0 auto", padding: "var(--space-10) var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-10)" }}>

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
          {/* KPI grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(200px,100%),1fr))", gap: "var(--space-4)" }}>
            {kpis.map(k => (
              <div key={k.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <div style={{ color: "var(--primary)" }}>{k.icon}</div>
                <div style={{ fontSize: "var(--text-xl)", fontWeight: 800, fontFamily: "var(--font-display)", lineHeight: 1.1 }}>{k.value}</div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", fontWeight: 600 }}>{k.label}</div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Daily activity bar chart */}
          <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-base)", fontWeight: 800 }}>Daily Activity — Last 30 Days</h2>
            <div
              ref={chartRef}
              style={{ position: "relative", display: "flex", alignItems: "flex-end", gap: "3px", height: "120px",
                background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)",
                padding: "var(--space-4) var(--space-4) 0" }}
            >
              {data.dailyActivity.map(d => (
                <div
                  key={d.date}
                  onMouseEnter={e => {
                    const rect = (e.target as HTMLElement).getBoundingClientRect();
                    const parent = chartRef.current?.getBoundingClientRect();
                    setTooltip({ text: `${d.date}: ${d.count} analyse${d.count !== 1 ? 's' : ''}`, x: rect.left - (parent?.left ?? 0) + rect.width / 2 });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    flex: 1,
                    background: d.count > 0 ? "var(--primary)" : "var(--border)",
                    borderRadius: "3px 3px 0 0",
                    height: `${Math.max((d.count / maxDaily) * 100, d.count > 0 ? 8 : 3)}%`,
                    opacity: d.count > 0 ? 0.85 : 0.3,
                    transition: "opacity .15s, height .3s",
                    minWidth: 0,
                  }}
                />
              ))}
              {tooltip && (
                <div style={{
                  position: "absolute", bottom: "calc(100% + 6px)", left: tooltip.x,
                  transform: "translateX(-50%)",
                  background: "var(--text)", color: "var(--surface)",
                  fontSize: "var(--text-xs)", fontWeight: 600,
                  padding: "var(--space-1) var(--space-2)",
                  borderRadius: "var(--radius-sm)", whiteSpace: "nowrap",
                  pointerEvents: "none", zIndex: 10,
                }}>
                  {tooltip.text}
                </div>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>
              <span>{data.dailyActivity[0]?.date}</span>
              <span>today</span>
            </div>
          </section>

          {/* Top repos + top orgs side by side */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(420px,100%),1fr))", gap: "var(--space-8)", alignItems: "start" }}>

            {/* Most Analysed Repos */}
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
                      <Link
                        href={`/repo/${r.slug}`}
                        style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--text)", textDecoration: "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}
                      >
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

            {/* Top Checked Orgs */}
            <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-base)", fontWeight: 800 }}>Top Checked Orgs</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {data.topOrgs.length === 0 && (
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--text-faint)" }}>No orgs checked yet — <Link href="/org" style={{ color: "var(--primary)", textDecoration: "none" }}>analyse an org</Link>.</p>
                )}
                {data.topOrgs.map((o, i) => (
                  <div key={o.org} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "var(--space-3) var(--space-4)" }}>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)", minWidth: "20px", textAlign: "right", fontWeight: 700 }}>#{i + 1}</span>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <Link
                        href={`/org?org=${o.org}`}
                        style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--text)", textDecoration: "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}
                      >
                        {o.org}
                      </Link>
                      <p style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)", margin: 0 }}>
                        {o.repoCount} repos{o.topRepo ? ` · top: ${o.topRepo}` : ""}
                      </p>
                    </div>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: 800, color: scoreColor(o.avgScore), minWidth: "32px", textAlign: "center" }}>{o.avgScore}</span>
                    <Building2 size={14} style={{ color: "var(--text-faint)", flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            </section>

          </div>
        </>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  );
}
