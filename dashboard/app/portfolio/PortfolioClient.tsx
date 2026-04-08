"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import ScoreRing from "@/components/ScoreRing";
import Link from "next/link";
import {
  Plus, RefreshCw, Trash2, ExternalLink, ArrowUpDown,
  LayoutGrid, List, Download, AlertCircle, CheckCircle2,
  Clock, TrendingUp, TrendingDown, Minus, X
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
type DimScores = Record<string, number>;

interface RepoEntry {
  slug: string;
  score: number | null;
  dims: DimScores | null;
  description: string | null;
  language: string | null;
  stars: number | null;
  forks: number | null;
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
}

type SortKey = "score" | "name" | "stars" | "forks" | "language";
type ViewMode = "grid" | "list";

const DIM_LABELS: Record<string, string> = {
  readme:    "README",
  commits:   "Commits",
  freshness: "Freshness",
  docs:      "Docs",
  cicd:      "CI/CD",
  issues:    "Issues",
  community: "Community",
  pr:        "PR",
  security:  "Security",
};

const STORAGE_KEY = "devlens:portfolio";

// ── Helpers ────────────────────────────────────────────────────────────────
const scoreColor = (s: number | null) =>
  s === null ? "var(--text-faint)"
  : s >= 80  ? "var(--success)"
  : s >= 50  ? "var(--warning)"
  : "var(--danger)";

const scoreBg = (s: number | null) =>
  s === null ? "var(--surface-off)"
  : s >= 80  ? "oklch(from var(--success) l c h / 0.08)"
  : s >= 50  ? "oklch(from var(--warning) l c h / 0.08)"
  : "oklch(from var(--danger) l c h / 0.08)";

function trendIcon(score: number | null, prev: number | null) {
  if (score === null || prev === null) return null;
  const diff = score - prev;
  if (diff > 2)  return <TrendingUp  size={13} style={{ color: "var(--success)" }} />;
  if (diff < -2) return <TrendingDown size={13} style={{ color: "var(--danger)" }}  />;
  return <Minus size={13} style={{ color: "var(--text-faint)" }} />;
}

function loadSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveSlugs(slugs: string[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs)); } catch {}
}

// ── Component ──────────────────────────────────────────────────────────────
export default function PortfolioClient() {
  const [repos, setRepos]       = useState<RepoEntry[]>([]);
  const [input, setInput]       = useState("");
  const [sortKey, setSortKey]   = useState<SortKey>("score");
  const [sortAsc, setSortAsc]   = useState(false);
  const [view, setView]         = useState<ViewMode>("grid");
  const [showDims, setShowDims] = useState(false);
  const [prevScores, setPrevScores] = useState<Record<string, number>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Load saved slugs on mount ────────────────────────────────────────────
  useEffect(() => {
    const saved = loadSlugs();
    if (saved.length > 0) {
      setRepos(saved.map(slug => ({
        slug, score: null, dims: null, description: null, language: null,
        stars: null, forks: null, loading: true, error: null, lastFetched: null,
      })));
    }
  }, []);

  // ── Fetch a single repo ──────────────────────────────────────────────────
  const fetchRepo = useCallback((slug: string) => {
    setRepos(prev => prev.map(r =>
      r.slug === slug ? { ...r, loading: true, error: null } : r
    ));
    fetch(`/api/analyze?repo=${slug}`, { cache: "no-store" })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.message ?? data.error);
        setRepos(prev => prev.map(r =>
          r.slug === slug ? {
            ...r,
            score:       data.healthScore ?? null,
            dims:        data.dimensions  ?? null,
            description: data.description ?? null,
            language:    data.language    ?? null,
            stars:       data.stars       ?? null,
            forks:       data.forks       ?? null,
            loading:     false,
            error:       null,
            lastFetched: new Date(),
          } : r
        ));
      })
      .catch(err => {
        setRepos(prev => prev.map(r =>
          r.slug === slug ? { ...r, loading: false, error: err.message ?? "Fetch failed" } : r
        ));
      });
  }, []);

  // ── Auto-fetch repos that are loading ───────────────────────────────────
  useEffect(() => {
    repos.filter(r => r.loading && !r.error && r.score === null).forEach(r => fetchRepo(r.slug));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repos.map(r => r.slug).join(",")]);

  // ── Add repo ─────────────────────────────────────────────────────────────
  const addRepo = () => {
    const raw   = input.trim().replace("https://github.com/", "").replace(/\/$/, "");
    const parts = raw.split("/").filter(Boolean);
    if (parts.length < 2) return;
    const slug = `${parts[0]}/${parts[1]}`;
    if (repos.some(r => r.slug === slug)) { setInput(""); return; }
    const next = [...repos, {
      slug, score: null, dims: null, description: null, language: null,
      stars: null, forks: null, loading: true, error: null, lastFetched: null,
    }];
    setRepos(next);
    saveSlugs(next.map(r => r.slug));
    setInput("");
    inputRef.current?.focus();
  };

  // ── Remove repo ──────────────────────────────────────────────────────────
  const removeRepo = (slug: string) => {
    const next = repos.filter(r => r.slug !== slug);
    setRepos(next);
    saveSlugs(next.map(r => r.slug));
  };

  // ── Refresh all ─────────────────────────────────────────────────────────
  const refreshAll = () => {
    setPrevScores(Object.fromEntries(repos.filter(r => r.score !== null).map(r => [r.slug, r.score!])));
    setRepos(prev => prev.map(r => ({ ...r, loading: true, error: null, score: null, dims: null })));
  };

  // ── Export JSON ──────────────────────────────────────────────────────────
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(repos, null, 2)], { type: "application/json" });
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(blob);
    a.download = "devlens-portfolio.json";
    a.click();
  };

  // ── Sort ─────────────────────────────────────────────────────────────────
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(false); }
  };

  const sorted = [...repos].sort((a, b) => {
    let diff = 0;
    if (sortKey === "score")    diff = (b.score ?? -1) - (a.score ?? -1);
    if (sortKey === "name")     diff = a.slug.localeCompare(b.slug);
    if (sortKey === "stars")    diff = (b.stars ?? -1) - (a.stars ?? -1);
    if (sortKey === "forks")    diff = (b.forks ?? -1) - (a.forks ?? -1);
    if (sortKey === "language") diff = (a.language ?? "").localeCompare(b.language ?? "");
    return sortAsc ? -diff : diff;
  });

  // ── Derived stats ─────────────────────────────────────────────────────────
  const scored   = repos.filter(r => r.score !== null);
  const avgScore = scored.length > 0 ? Math.round(scored.reduce((s, r) => s + r.score!, 0) / scored.length) : null;
  const topRepo  = scored.length > 0 ? scored.reduce((best, r) => r.score! > best.score! ? r : best) : null;
  const atRisk   = scored.filter(r => r.score! < 50);

  // ── Dim averages ─────────────────────────────────────────────────────────
  const dimAvgs: Record<string, number> = {};
  if (showDims) {
    const dimRepos = scored.filter(r => r.dims);
    if (dimRepos.length > 0) {
      const allKeys = Object.keys(dimRepos[0].dims!);
      for (const k of allKeys) {
        const vals = dimRepos.map(r => r.dims![k]).filter(v => v !== undefined);
        dimAvgs[k] = Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
      }
    }
  }

  return (
    <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "var(--space-10) var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        <p style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>
          <Link href="/" style={{ color: "var(--primary)", textDecoration: "none" }}>← Home</Link>
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-4)" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 800, lineHeight: 1.1 }}>📁 Portfolio Dashboard</h1>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginTop: "var(--space-1)" }}>Track health scores across all your repos in one place.</p>
          </div>
          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
            <button onClick={refreshAll} disabled={repos.length === 0}
              style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-2) var(--space-3)",
                fontSize: "var(--text-xs)", fontWeight: 600, borderRadius: "var(--radius-md)",
                background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)",
                cursor: repos.length === 0 ? "not-allowed" : "pointer", opacity: repos.length === 0 ? 0.5 : 1 }}>
              <RefreshCw size={13} /> Refresh All
            </button>
            <button onClick={exportJSON} disabled={scored.length === 0}
              style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-2) var(--space-3)",
                fontSize: "var(--text-xs)", fontWeight: 600, borderRadius: "var(--radius-md)",
                background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)",
                cursor: scored.length === 0 ? "not-allowed" : "pointer", opacity: scored.length === 0 ? 0.5 : 1 }}>
              <Download size={13} /> Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* ── Add repo input ── */}
      <form onSubmit={e => { e.preventDefault(); addRepo(); }}
        style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="owner/repo or https://github.com/owner/repo"
          style={{ flex: 1, minWidth: "240px", padding: "var(--space-3) var(--space-4)",
            fontSize: "var(--text-sm)", borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)", background: "var(--surface-off)",
            color: "var(--text)", outline: "none" }}
        />
        <button type="submit"
          style={{ display: "flex", alignItems: "center", gap: "var(--space-2)",
            padding: "var(--space-3) var(--space-5)", fontSize: "var(--text-sm)", fontWeight: 700,
            borderRadius: "var(--radius-md)", background: "var(--primary)", color: "#fff", border: "none", cursor: "pointer" }}>
          <Plus size={15} /> Add Repo
        </button>
      </form>

      {/* ── Summary KPIs ── */}
      {repos.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(180px,100%),1fr))", gap: "var(--space-4)" }}>
          {[
            { label: "Repos",      value: repos.length,                      sub: "in portfolio" },
            { label: "Avg Score",  value: avgScore !== null ? `${avgScore}/100` : "…", sub: "portfolio average" },
            { label: "Top Repo",   value: topRepo?.slug.split("/")[1] ?? "…", sub: topRepo ? `${topRepo.score}/100` : "" },
            { label: "At Risk",    value: atRisk.length,                     sub: "score < 50" },
          ].map(k => (
            <div key={k.label}
              style={{ background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)", padding: "var(--space-4) var(--space-5)",
                display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
              <div style={{ fontSize: "var(--text-xl)", fontWeight: 800, fontFamily: "var(--font-display)", lineHeight: 1.1,
                color: k.label === "At Risk" && atRisk.length > 0 ? "var(--danger)" : "var(--text)" }}>
                {k.value}
              </div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", fontWeight: 600 }}>{k.label}</div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>{k.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Toolbar ── */}
      {repos.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-3)" }}>
          {/* Sort controls */}
          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)", fontWeight: 600 }}>Sort:</span>
            {(["score", "name", "stars", "forks", "language"] as SortKey[]).map(k => (
              <button key={k} onClick={() => toggleSort(k)}
                style={{ display: "flex", alignItems: "center", gap: "4px",
                  padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-full)",
                  fontSize: "var(--text-xs)", fontWeight: 600,
                  background: sortKey === k ? "var(--primary)" : "var(--surface)",
                  color: sortKey === k ? "#fff" : "var(--text-muted)",
                  border: "1px solid var(--border)", cursor: "pointer" }}>
                {k} {sortKey === k && <ArrowUpDown size={10} />}
              </button>
            ))}
          </div>
          {/* Right controls */}
          <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
            <button onClick={() => setShowDims(d => !d)}
              style={{ padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-full)",
                fontSize: "var(--text-xs)", fontWeight: 600,
                background: showDims ? "var(--primary)" : "var(--surface)",
                color: showDims ? "#fff" : "var(--text-muted)",
                border: "1px solid var(--border)", cursor: "pointer" }}>
              Dimensions
            </button>
            {(["grid", "list"] as ViewMode[]).map(v => (
              <button key={v} onClick={() => setView(v)}
                title={v === "grid" ? "Grid view" : "List view"}
                style={{ padding: "var(--space-2)", borderRadius: "var(--radius-md)",
                  background: view === v ? "var(--primary)" : "var(--surface)",
                  color: view === v ? "#fff" : "var(--text-muted)",
                  border: "1px solid var(--border)", cursor: "pointer",
                  display: "flex", alignItems: "center" }}>
                {v === "grid" ? <LayoutGrid size={14} /> : <List size={14} />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Dimension averages bar ── */}
      {showDims && Object.keys(dimAvgs).length > 0 && (
        <section style={{ background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)", padding: "var(--space-5)" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-sm)", fontWeight: 800, marginBottom: "var(--space-4)" }}>Portfolio Dimension Averages</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(160px,100%),1fr))", gap: "var(--space-3)" }}>
            {Object.entries(dimAvgs).map(([k, avg]) => (
              <div key={k}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-1)" }}>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", fontWeight: 600 }}>{DIM_LABELS[k] ?? k}</span>
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: 800, color: scoreColor(avg) }}>{avg}</span>
                </div>
                <div style={{ height: "6px", borderRadius: "var(--radius-full)", background: "var(--border)" }}>
                  <div style={{ height: "100%", width: `${avg}%`, borderRadius: "var(--radius-full)",
                    background: scoreColor(avg), transition: "width .4s" }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Empty state ── */}
      {repos.length === 0 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
          padding: "var(--space-20) var(--space-8)", color: "var(--text-muted)", gap: "var(--space-4)" }}>
          <div style={{ fontSize: "3rem" }}>📁</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--text)" }}>No repos yet</h2>
          <p style={{ maxWidth: "36ch", fontSize: "var(--text-sm)" }}>Add your first repo above to start tracking. Your portfolio is saved in your browser.</p>
        </div>
      )}

      {/* ── Grid view ── */}
      {view === "grid" && repos.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(280px,100%),1fr))", gap: "var(--space-5)" }}>
          {sorted.map(r => (
            <div key={r.slug}
              style={{ background: scoreBg(r.score), border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)", padding: "var(--space-5)",
                display: "flex", flexDirection: "column", gap: "var(--space-4)",
                position: "relative", transition: "box-shadow .15s" }}>

              {/* Remove btn */}
              <button onClick={() => removeRepo(r.slug)}
                style={{ position: "absolute", top: "var(--space-3)", right: "var(--space-3)",
                  background: "transparent", border: "none", cursor: "pointer",
                  color: "var(--text-faint)", padding: "var(--space-1)", borderRadius: "var(--radius-sm)" }}>
                <X size={13} />
              </button>

              {/* Score ring + slug */}
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <ScoreRing score={r.score ?? 0} size={52} />
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <Link href={`/repo/${r.slug}`}
                    style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text)",
                      textDecoration: "none", display: "block",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.slug}
                  </Link>
                  {r.loading && <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>Analyzing…</span>}
                  {r.error  && <span style={{ fontSize: "var(--text-xs)", color: "var(--danger)"     }}>Error</span>}
                  {r.score !== null && !r.loading && (
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)", marginTop: "2px" }}>
                      <span style={{ fontSize: "var(--text-xl)", fontWeight: 900, color: scoreColor(r.score), lineHeight: 1 }}>{r.score}</span>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>/100</span>
                      {trendIcon(r.score, prevScores[r.slug] ?? null)}
                    </div>
                  )}
                </div>
              </div>

              {/* Meta row */}
              {(r.language || r.stars !== null || r.forks !== null) && (
                <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
                  {r.language && <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", background: "var(--surface-off)", padding: "2px var(--space-2)", borderRadius: "var(--radius-full)" }}>{r.language}</span>}
                  {r.stars  !== null && <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>⭐ {r.stars.toLocaleString()}</span>}
                  {r.forks  !== null && <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>🍴 {r.forks.toLocaleString()}</span>}
                </div>
              )}

              {/* Description */}
              {r.description && (
                <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", margin: 0,
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {r.description}
                </p>
              )}

              {/* Dimension bars */}
              {showDims && r.dims && (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", borderTop: "1px solid var(--border)", paddingTop: "var(--space-3)" }}>
                  {Object.entries(r.dims).slice(0, 5).map(([k, v]) => (
                    <div key={k}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>{DIM_LABELS[k] ?? k}</span>
                        <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: scoreColor(v) }}>{v}</span>
                      </div>
                      <div style={{ height: "4px", borderRadius: "var(--radius-full)", background: "var(--border)" }}>
                        <div style={{ height: "100%", width: `${v}%`, borderRadius: "var(--radius-full)",
                          background: scoreColor(v), transition: "width .4s" }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Error detail */}
              {r.error && (
                <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-start",
                  background: "oklch(from var(--danger) l c h / 0.08)", borderRadius: "var(--radius-md)",
                  padding: "var(--space-3)", fontSize: "var(--text-xs)", color: "var(--danger)" }}>
                  <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                  {r.error}
                </div>
              )}

              {/* Footer */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: "var(--space-2)" }}>
                {r.lastFetched
                  ? <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={11} /> {r.lastFetched.toLocaleTimeString()}
                    </span>
                  : <span />}
                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  <button onClick={() => fetchRepo(r.slug)} disabled={r.loading}
                    style={{ background: "transparent", border: "none", cursor: r.loading ? "not-allowed" : "pointer",
                      color: "var(--text-faint)", padding: "var(--space-1)", opacity: r.loading ? 0.4 : 1 }}>
                    <RefreshCw size={13} />
                  </button>
                  <a href={`https://github.com/${r.slug}`} target="_blank" rel="noopener noreferrer"
                    style={{ color: "var(--text-faint)", display: "flex", alignItems: "center" }}>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── List view ── */}
      {view === "list" && repos.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {sorted.map(r => (
            <div key={r.slug}
              style={{ display: "flex", alignItems: "center", gap: "var(--space-4)",
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)", padding: "var(--space-3) var(--space-5)",
                flexWrap: "wrap" }}>

              <ScoreRing score={r.score ?? 0} size={40} />

              <div style={{ flex: 1, minWidth: "160px", overflow: "hidden" }}>
                <Link href={`/repo/${r.slug}`}
                  style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text)",
                    textDecoration: "none", whiteSpace: "nowrap", overflow: "hidden",
                    textOverflow: "ellipsis", display: "block" }}>
                  {r.slug}
                </Link>
                {r.description && (
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)", margin: 0,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.description}
                  </p>
                )}
              </div>

              {r.language && <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", background: "var(--surface-off)", padding: "2px var(--space-2)", borderRadius: "var(--radius-full)", flexShrink: 0 }}>{r.language}</span>}
              {r.stars !== null && <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)", flexShrink: 0 }}>⭐ {r.stars.toLocaleString()}</span>}

              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginLeft: "auto" }}>
                {r.loading
                  ? <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>Analyzing…</span>
                  : r.error
                  ? <span style={{ fontSize: "var(--text-xs)", color: "var(--danger)", display: "flex", alignItems: "center", gap: "4px" }}><AlertCircle size={12} /> Error</span>
                  : r.score !== null
                  ? <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                      {trendIcon(r.score, prevScores[r.slug] ?? null)}
                      <span style={{ fontSize: "var(--text-base)", fontWeight: 900, color: scoreColor(r.score), minWidth: "32px", textAlign: "right" }}>{r.score}</span>
                    </div>
                  : null}

                <button onClick={() => fetchRepo(r.slug)} disabled={r.loading}
                  style={{ background: "transparent", border: "none", cursor: r.loading ? "not-allowed" : "pointer",
                    color: "var(--text-faint)", padding: "var(--space-1)", opacity: r.loading ? 0.4 : 1 }}>
                  <RefreshCw size={13} />
                </button>
                <a href={`https://github.com/${r.slug}`} target="_blank" rel="noopener noreferrer"
                  style={{ color: "var(--text-faint)", display: "flex", alignItems: "center" }}>
                  <ExternalLink size={13} />
                </a>
                <button onClick={() => removeRepo(r.slug)}
                  style={{ background: "transparent", border: "none", cursor: "pointer",
                    color: "var(--text-faint)", padding: "var(--space-1)", borderRadius: "var(--radius-sm)" }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
