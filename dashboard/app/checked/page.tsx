"use client";
import { useState, useEffect } from "react";
import { Loader2, ExternalLink, Search } from "lucide-react";
import Link from "next/link";
import type { WatchEntry } from "@/app/api/watchlist/route";

const CATEGORIES = [
  { label: "Excellent", emoji: "🌟", min: 90, max: 100, color: "var(--success)" },
  { label: "Good",      emoji: "🟢", min: 75, max: 89,  color: "#22c55e" },
  { label: "Fair",      emoji: "🟡", min: 60, max: 74,  color: "var(--warning)" },
  { label: "Needs Work",emoji: "🟠", min: 40, max: 59,  color: "#f97316" },
  { label: "Critical",  emoji: "🔴", min: 0,  max: 39,  color: "var(--danger)" },
];

export default function CheckedPage() {
  const [list, setList] = useState<WatchEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/watchlist")
      .then(r => r.json())
      .then(d => setList(d.list ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = search.trim()
    ? list.filter(w => w.slug.toLowerCase().includes(search.toLowerCase()))
    : list;

  const scoreColor = (s: number) => s >= 80 ? "var(--success)" : s >= 50 ? "var(--warning)" : "var(--danger)";

  return (
    <main style={{ maxWidth: "780px", margin: "0 auto", padding: "var(--space-10) var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        <p style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>
          <Link href="/" style={{ color: "var(--primary)", textDecoration: "none" }}>← Home</Link>
        </p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 800 }}>All Checked Repos</h1>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
          {loading ? "Loading…" : `${list.length} repos checked by DevLens visitors — categorized by health score.`}
        </p>
      </div>

      {/* Search */}
      {!loading && list.length > 0 && (
        <div style={{ position: "relative", maxWidth: "360px" }}>
          <Search size={14} style={{ position: "absolute", left: "var(--space-3)", top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)", pointerEvents: "none" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter repos…"
            style={{ width: "100%", padding: "var(--space-2) var(--space-3) var(--space-2) calc(var(--space-3) + 22px)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", background: "var(--surface-2)", color: "var(--text)", fontSize: "var(--text-sm)", outline: "none" }}
          />
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--text-faint)" }}>
          <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Loading…
        </div>
      )}

      {/* Categories */}
      {!loading && CATEGORIES.map(cat => {
        const repos = filtered.filter(w => w.score >= cat.min && w.score <= cat.max);
        if (repos.length === 0) return null;
        return (
          <section key={cat.label} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <span style={{ fontSize: "1.1rem" }}>{cat.emoji}</span>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-base)", fontWeight: 800, color: cat.color }}>{cat.label}</h2>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)", background: "var(--surface-off)", border: "1px solid var(--border)", borderRadius: "var(--radius-full)", padding: "1px 8px" }}>{repos.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {repos.map(w => (
                <div key={w.slug} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "var(--space-3) var(--space-4)" }}>
                  <span style={{ fontWeight: 800, fontSize: "var(--text-sm)", color: scoreColor(w.score), minWidth: "36px", textAlign: "center" }}>{w.score}</span>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <Link
                      href={`/repo/${w.slug}`}
                      style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--text)", textDecoration: "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}
                    >
                      {w.slug}
                    </Link>
                    {w.description && <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>{w.description}</p>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexShrink: 0 }}>
                    {w.language && <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>{w.language}</span>}
                    <a href={`/repo/${w.slug}`} title="Full report" style={{ color: "var(--text-faint)", display: "flex" }}>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {!loading && filtered.length === 0 && (
        <p style={{ fontSize: "var(--text-sm)", color: "var(--text-faint)" }}>No repos match your search.</p>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  );
}
