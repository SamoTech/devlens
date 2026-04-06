"use client";
import { useState } from "react";
import { Search, Loader2, Github, BarChart2, ArrowRight } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import RepoCard from "@/components/RepoCard";
import TrendChart from "@/components/TrendChart";
import SnippetModal from "@/components/SnippetModal";
import type { RepoReport } from "@/lib/scorer";
import Link from "next/link";

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<RepoReport | null>(null);
  const [history, setHistory] = useState<{week:string;score:number}[]>([]);
  const [error, setError] = useState("");
  const [showSnippet, setShowSnippet] = useState(false);

  async function analyze(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true); setError(""); setReport(null); setHistory([]);
    try {
      const slug = input.trim().replace("https://github.com/","").replace(/\/+$/,"");
      const [res, histRes] = await Promise.all([
        fetch(`/api/analyze?repo=${encodeURIComponent(slug)}`),
        fetch(`/api/history?repo=${encodeURIComponent(slug)}`),
      ]);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Analysis failed"); return; }
      setReport(data);
      const hData = await histRes.json();
      if (histRes.ok) setHistory(hData.history ?? []);
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  }

  return (
    <>
      {showSnippet && report && <SnippetModal repo={report.repo} onClose={() => setShowSnippet(false)} />}
      <div style={{ minHeight:"100dvh",display:"flex",flexDirection:"column" }}>
        <header style={{ position:"sticky",top:0,zIndex:50,background:"var(--surface)",borderBottom:"1px solid var(--divider)",backdropFilter:"blur(12px)" }}>
          <div style={{ maxWidth:"1200px",margin:"0 auto",padding:"var(--space-3) var(--space-6)",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
            <div style={{ display:"flex",alignItems:"center",gap:"var(--space-2)" }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-label="DevLens logo">
                <rect width="28" height="28" rx="6" fill="var(--primary)"/>
                <circle cx="14" cy="14" r="6" fill="none" stroke="white" strokeWidth="2"/>
                <circle cx="14" cy="14" r="2" fill="white"/>
                <line x1="20" y1="20" x2="24" y2="24" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span style={{ fontFamily:"var(--font-display)",fontWeight:800,fontSize:"var(--text-base)" }}>DevLens</span>
            </div>
            <div style={{ display:"flex",alignItems:"center",gap:"var(--space-2)" }}>
              <Link href="/compare" style={{ fontSize:"var(--text-sm)",color:"var(--text-muted)",textDecoration:"none",padding:"var(--space-2) var(--space-3)",borderRadius:"var(--radius-md)",display:"flex",alignItems:"center",gap:"var(--space-1)" }}>
                <BarChart2 size={15}/> Compare
              </Link>
              <a href="https://github.com/SamoTech/devlens" target="_blank" rel="noopener noreferrer" style={{ color:"var(--text-muted)",padding:"var(--space-2)" }} aria-label="GitHub"><Github size={18}/></a>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main style={{ flex:1 }}>
          <section style={{ padding:"clamp(3rem,8vw,6rem) var(--space-6)",textAlign:"center" }}>
            <div style={{ maxWidth:"680px",margin:"0 auto",display:"flex",flexDirection:"column",gap:"var(--space-6)" }}>
              <div style={{ display:"flex",flexDirection:"column",gap:"var(--space-3)" }}>
                <h1 style={{ fontFamily:"var(--font-display)",fontSize:"var(--text-2xl)",fontWeight:800,color:"var(--text)",lineHeight:1.1 }}>
                  Repo Health.<br/><span style={{ color:"var(--primary)" }}>In 7 Dimensions.</span>
                </h1>
                <p style={{ fontSize:"var(--text-base)",color:"var(--text-muted)",maxWidth:"480px",margin:"0 auto" }}>Paste any public GitHub repo URL and get a live health score — free, forever.</p>
              </div>
              <form onSubmit={analyze} style={{ display:"flex",gap:"var(--space-2)",flexWrap:"wrap",justifyContent:"center" }}>
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
          {report && (
            <section style={{ padding:"0 var(--space-6) var(--space-16)",maxWidth:"780px",margin:"0 auto",display:"flex",flexDirection:"column",gap:"var(--space-6)" }}>
              <RepoCard report={report} onSnippet={()=>setShowSnippet(true)}/>
              {history.length>0 && <TrendChart data={history}/>}
            </section>
          )}
          {!report && !loading && (
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
        </main>
        <footer style={{ borderTop:"1px solid var(--divider)",padding:"var(--space-6)",textAlign:"center",fontSize:"var(--text-xs)",color:"var(--text-faint)" }}>
          Built by <a href="https://github.com/SamoTech" target="_blank" rel="noopener noreferrer" style={{ color:"var(--primary)" }}>SamoTech</a> · Free forever · <a href="https://github.com/SamoTech/devlens" target="_blank" rel="noopener noreferrer" style={{ color:"var(--primary)" }}>GitHub</a>
        </footer>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} input:focus{border-color:var(--primary)!important;box-shadow:0 0 0 3px var(--primary-hl)}`}</style>
    </>
  );
}
