"use client";
import { useState, useEffect } from "react";
import { Search, Loader2, ArrowRight, Bookmark, X, ExternalLink } from "lucide-react";
import RepoCard from "@/components/RepoCard";
import TrendChart from "@/components/TrendChart";
import SnippetModal from "@/components/SnippetModal";
import type { RepoReport } from "@/lib/scorer";

interface WatchEntry { slug: string; score: number; description: string | null; language: string | null; savedAt: string; }

const STORAGE_KEY = "devlens_watchlist";

function loadWatchlist(): WatchEntry[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; }
}
function saveWatchlist(list: WatchEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<RepoReport | null>(null);
  const [history, setHistory] = useState<{week:string;score:number}[]>([]);
  const [error, setError] = useState("");
  const [showSnippet, setShowSnippet] = useState(false);
  const [watchlist, setWatchlist] = useState<WatchEntry[]>([]);

  useEffect(() => { setWatchlist(loadWatchlist()); }, []);

  async function analyze(e: React.FormEvent | null, slug?: string) {
    if (e) e.preventDefault();
    const target = slug ?? input.trim().replace("https://github.com/","").replace(/\/+$/,"");
    if (!target) return;
    setLoading(true); setError(""); setReport(null); setHistory([]);
    try {
      const [res, histRes] = await Promise.all([
        fetch(`/api/analyze?repo=${encodeURIComponent(target)}`),
        fetch(`/api/history?repo=${encodeURIComponent(target)}`),
      ]);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Analysis failed"); return; }
      setReport(data);
      const hData = await histRes.json();
      if (histRes.ok) setHistory(hData.history ?? []);
      const entry: WatchEntry = { slug: target, score: data.health_score, description: data.description, language: data.language, savedAt: new Date().toISOString() };
      const updated = [entry, ...loadWatchlist().filter(w => w.slug !== target)];
      saveWatchlist(updated);
      setWatchlist(updated);
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  }

  function removeFromWatchlist(slug: string) {
    const updated = loadWatchlist().filter(w => w.slug !== slug);
    saveWatchlist(updated);
    setWatchlist(updated);
  }

  const scoreColor = (s: number) => s >= 80 ? "var(--success)" : s >= 50 ? "var(--warning)" : "var(--danger)";

  return (
    <>
      {showSnippet && report && <SnippetModal repo={report.repo} onClose={() => setShowSnippet(false)} />}

      {/* Hero */}
      <section style={{ padding:"clamp(3rem,8vw,6rem) var(--space-6)",textAlign:"center" }}>
        <div style={{ maxWidth:"680px",margin:"0 auto",display:"flex",flexDirection:"column",gap:"var(--space-6)" }}>
          <div style={{ display:"flex",flexDirection:"column",gap:"var(--space-3)" }}>
            <h1 style={{ fontFamily:"var(--font-display)",fontSize:"var(--text-2xl)",fontWeight:800,color:"var(--text)",lineHeight:1.1 }}>
              Repo Health.<br/><span style={{ color:"var(--primary)" }}>In 7 Dimensions.</span>
            </h1>
            <p style={{ fontSize:"var(--text-base)",color:"var(--text-muted)",maxWidth:"480px",margin:"0 auto" }}>Paste any public GitHub repo URL and get a live health score — free, forever.</p>
          </div>
          <form onSubmit={(e) => analyze(e)} style={{ display:"flex",gap:"var(--space-2)",flexWrap:"wrap",justifyContent:"center" }}>
            <div style={{ position:"relative",flex:"1 1 320px",maxWidth:"460px" }}>
              <Search size={16} style={{ position:"absolute",left:"var(--space-3)",top:"50%",transform:"translateY(-50%)",color:"var(--text-faint)",pointerEvents:"none" }}/>
              <input value={input} onChange={e=>setInput(e.target.value)} placeholder="owner/repo or github.com/owner/repo" aria-label="GitHub repository"
                style={{ width:"100%",padding:"var(--space-3) var(--space-3) var(--space-3) calc(var(--space-3) + 24px)",border:"1px solid var(--border)",borderRadius:"var(--radius-lg)",background:"var(--surface-2)",color:"var(--text)",fontSize:"var(--text-sm)",outline:"none" }}/>
            </div>
            <button type="submit" disabled={loading} style={{ padding:"var(--space-3) var(--space-6)",background:loading?"var(--primary-hl)":"var(--primary)",color:"white",borderRadius:"var(--radius-lg)",fontWeight:600,fontSize:"var(--text-sm)",display:"flex",alignItems:"center",gap:"var(--space-2)",flexShrink:0 }}>
              {loading ? <><Loader2 size={16} style={{ animation:"spin 1s linear infinite" }}/> Analyzing…</> : <><ArrowRight size={16}/> Analyze</>}
            </button>
          </form>
          {error && <p style={{ color:"var(--error)",fontSize:"var(--text-sm)" }}>{error}</p>}
        </div>
      </section>

      {/* Result */}
      {report && (
        <section style={{ padding:"0 var(--space-6) var(--space-16)",maxWidth:"780px",margin:"0 auto",display:"flex",flexDirection:"column",gap:"var(--space-6)" }}>
          <RepoCard report={report} onSnippet={()=>setShowSnippet(true)}/>
          {history.length>0 && <TrendChart data={history}/>}
        </section>
      )}

      {/* Checked Repos watchlist */}
      {watchlist.length > 0 && (
        <section style={{ padding:"0 var(--space-6) var(--space-16)",maxWidth:"780px",margin:"0 auto",display:"flex",flexDirection:"column",gap:"var(--space-4)" }}>
          <div style={{ display:"flex",alignItems:"center",gap:"var(--space-2)" }}>
            <Bookmark size={16} style={{ color:"var(--primary)" }}/>
            <h2 style={{ fontFamily:"var(--font-display)",fontSize:"var(--text-base)",fontWeight:800 }}>Checked Repos</h2>
            <span style={{ fontSize:"var(--text-xs)",color:"var(--text-faint)",marginLeft:"auto" }}>{watchlist.length} saved</span>
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:"var(--space-2)" }}>
            {watchlist.map(w => (
              <div key={w.slug} style={{ display:"flex",alignItems:"center",gap:"var(--space-3)",background:"var(--surface-off)",border:"1px solid var(--border)",borderRadius:"var(--radius-lg)",padding:"var(--space-3) var(--space-4)",cursor:"pointer",transition:"background .15s" }}
                onClick={() => { setInput(w.slug); analyze(null, w.slug); }}>
                <span style={{ fontWeight:800,fontSize:"var(--text-sm)",color:scoreColor(w.score),minWidth:"36px",textAlign:"center" }}>{w.score}</span>
                <div style={{ flex:1,overflow:"hidden" }}>
                  <p style={{ fontWeight:600,fontSize:"var(--text-sm)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{w.slug}</p>
                  {w.description && <p style={{ fontSize:"var(--text-xs)",color:"var(--text-muted)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{w.description}</p>}
                </div>
                {w.language && <span style={{ fontSize:"var(--text-xs)",color:"var(--text-faint)",flexShrink:0 }}>{w.language}</span>}
                <a href={`/repo/${w.slug}`} onClick={e=>e.stopPropagation()} target="_blank" rel="noopener noreferrer"
                  style={{ color:"var(--text-faint)",flexShrink:0,display:"flex" }} title="Open permalink">
                  <ExternalLink size={14}/>
                </a>
                <button onClick={e=>{ e.stopPropagation(); removeFromWatchlist(w.slug); }}
                  style={{ color:"var(--text-faint)",flexShrink:0,display:"flex",background:"none",border:"none",cursor:"pointer",padding:0 }} title="Remove">
                  <X size={14}/>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Feature grid (empty state) */}
      {!report && !loading && watchlist.length === 0 && (
        <section style={{ padding:"0 var(--space-6) var(--space-16)",maxWidth:"960px",margin:"0 auto" }}>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(min(260px,100%), 1fr))",gap:"var(--space-4)" }}>
            {[{emoji:"📝",title:"README Quality",desc:"Length, sections, badges, code blocks"},{emoji:"🔥",title:"Commit Activity",desc:"Push frequency over last 90 days"},{emoji:"🌿",title:"Repo Freshness",desc:"Days since last push to main"},{emoji:"📚",title:"Documentation",desc:"LICENSE, CONTRIBUTING, CHANGELOG, SECURITY"},{emoji:"⚙️",title:"CI/CD Setup",desc:"GitHub Actions workflows detected"},{emoji:"🎯",title:"Issue Response",desc:"Closed vs open issue ratio"},{emoji:"⭐",title:"Community Signal",desc:"Stars, forks, watchers momentum"}].map(f=>(
              <div key={f.title} style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius-lg)",padding:"var(--space-5)",display:"flex",flexDirection:"column",gap:"var(--space-2)" }}>
                <span style={{ fontSize:"1.5rem" }}>{f.emoji}</span>
                <span style={{ fontWeight:700,fontSize:"var(--text-sm)" }}>{f.title}</span>
                <span style={{ fontSize:"var(--text-xs)",color:"var(--text-muted)" }}>{f.desc}</span>
              </div>
            ))}
          </div>
        </section>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} input:focus{border-color:var(--primary)!important;box-shadow:0 0 0 3px var(--primary-hl)}`}</style>
    </>
  );
}