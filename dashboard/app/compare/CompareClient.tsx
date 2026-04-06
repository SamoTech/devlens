"use client";
import { useState } from "react";
import { Loader2, ArrowLeftRight } from "lucide-react";
import ScoreRing from "@/components/ScoreRing";
import { DIM_META, badgeColor } from "@/lib/constants";
import type { RepoReport } from "@/lib/scorer";

const inputStyle: React.CSSProperties = {
  padding: "var(--space-3) var(--space-4)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)",
  background: "var(--surface-2)",
  color: "var(--text)",
  fontSize: "var(--text-sm)",
  outline: "none",
  width: "100%",
};

export default function CompareClient() {
  const [repoA, setRepoA] = useState("");
  const [repoB, setRepoB] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ a: RepoReport; b: RepoReport } | null>(null);
  const [error, setError] = useState("");

  async function compare(e: React.FormEvent) {
    e.preventDefault();
    if (!repoA.trim() || !repoB.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(
        `/api/compare?a=${encodeURIComponent(repoA)}&b=${encodeURIComponent(repoB)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Compare failed");
        return;
      }
      setResult(data);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "var(--space-12) var(--space-6)" }}>
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-8)",
        }}
      >
        {/* Header */}
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-xl)",
              fontWeight: 800,
              marginBottom: "var(--space-2)",
            }}
          >
            Compare Repos
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
            Analyze two repositories side by side across all 7 health dimensions.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={compare}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            gap: "var(--space-3)",
            alignItems: "center",
          }}
        >
          <input
            value={repoA}
            onChange={(e) => setRepoA(e.target.value)}
            placeholder="owner/repo-a"
            aria-label="First repository"
            style={inputStyle}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "var(--space-2)",
            }}
          >
            <ArrowLeftRight size={18} color="var(--text-faint)" />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "var(--space-2) var(--space-4)",
                background: "var(--primary)",
                color: "white",
                borderRadius: "var(--radius-md)",
                fontWeight: 600,
                fontSize: "var(--text-sm)",
                display: "flex",
                alignItems: "center",
                gap: "var(--space-1)",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                "Compare"
              )}
            </button>
          </div>
          <input
            value={repoB}
            onChange={(e) => setRepoB(e.target.value)}
            placeholder="owner/repo-b"
            aria-label="Second repository"
            style={inputStyle}
          />
        </form>

        {/* Error */}
        {error && (
          <p style={{ color: "var(--error)", textAlign: "center", fontSize: "var(--text-sm)" }}>
            {error}
          </p>
        )}

        {/* Results */}
        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
            {/* Score rings */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
              {[result.a, result.b].map((r) => (
                <div
                  key={r.repo}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-xl)",
                    padding: "var(--space-6)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "var(--space-3)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <ScoreRing score={r.health_score} size={100} />
                  <p
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: "var(--text-sm)",
                      textAlign: "center",
                      wordBreak: "break-all",
                    }}
                  >
                    {r.repo}
                  </p>
                  <p
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--text-muted)",
                      textAlign: "center",
                    }}
                  >
                    {r.description ?? "No description"}
                  </p>
                </div>
              ))}
            </div>

            {/* Dimension breakdown */}
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-xl)",
                padding: "var(--space-6)",
                boxShadow: "var(--shadow-sm)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-5)",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-base)",
                  fontWeight: 700,
                  paddingBottom: "var(--space-3)",
                  borderBottom: "1px solid var(--divider)",
                }}
              >
                Dimension Breakdown
              </h2>
              {DIM_META.map((d) => {
                const sa = result.a.scores[d.key as keyof typeof result.a.scores];
                const sb = result.b.scores[d.key as keyof typeof result.b.scores];
                return (
                  <div key={d.key} style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>
                        {d.emoji} {d.label}
                      </span>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>
                        {d.weight}
                      </span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)" }}>
                      {[
                        { r: result.a, s: sa },
                        { r: result.b, s: sb },
                      ].map(({ r, s }) => (
                        <div key={r.repo} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span
                              style={{
                                fontSize: "var(--text-xs)",
                                color: "var(--text-muted)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {r.name}
                            </span>
                            <span
                              style={{
                                fontSize: "var(--text-xs)",
                                fontWeight: 700,
                                color: badgeColor(s),
                                flexShrink: 0,
                                marginLeft: "4px",
                              }}
                            >
                              {s}
                            </span>
                          </div>
                          <div
                            style={{
                              height: "6px",
                              borderRadius: "var(--radius-full)",
                              background: "var(--surface-off)",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                borderRadius: "var(--radius-full)",
                                background: badgeColor(s),
                                width: `${s}%`,
                                transition: "width 0.7s cubic-bezier(0.16,1,0.3,1)",
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus { border-color: var(--primary) !important; box-shadow: 0 0 0 3px var(--primary-hl); }
      `}</style>
    </div>
  );
}
