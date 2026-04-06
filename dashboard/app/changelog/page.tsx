import type { Metadata } from "next";
export const metadata: Metadata = { title: "Changelog" };
const releases = [
  { version:"v0.3.0", date:"April 2026", tag:"Latest", changes:["Added shared Nav and Footer across all pages","New pages: About, FAQ, Terms, Privacy, Cookies, Sponsor, Docs","Added sitemap.ts and robots.ts for SEO","Upgraded Next.js to 15.3.6 (patches CVE-2025-66478)","Fixed NextAuth v5 route handler exports for Next.js 15"] },
  { version:"v0.2.0", date:"April 2026", tag:null, changes:["Restored original dashboard from commit 643acc5","Fixed PostCSS config conflict (removed stale tailwind reference)","Upgraded Next.js from 15.2.4 to 15.3.1"] },
  { version:"v0.1.0", date:"April 2026", tag:null, changes:["Initial release: live GitHub API scoring","7-dimension health score (README, Activity, Freshness, Docs, CI, Issues, Community)","Animated ScoreRing, DimBar progress bars, TrendChart","Dark/light mode with system preference detection","Compare two repos side by side","Copy-paste snippet modal for README integration"] },
];
export default function ChangelogPage() {
  return (
    <div style={{ maxWidth:"720px",margin:"0 auto",padding:"var(--space-16) var(--space-6)" }}>
      <h1 style={{ fontFamily:"var(--font-display)",fontSize:"var(--text-xl)",fontWeight:800,marginBottom:"var(--space-2)" }}>Changelog</h1>
      <p style={{ color:"var(--text-muted)",marginBottom:"var(--space-10)",fontSize:"var(--text-sm)" }}>All notable changes to DevLens, newest first.</p>
      <div style={{ display:"flex",flexDirection:"column",gap:"0",borderLeft:"2px solid var(--divider)",paddingLeft:"var(--space-6)" }}>
        {releases.map(r=>(
          <div key={r.version} style={{ position:"relative",paddingBottom:"var(--space-10)" }}>
            <div style={{ position:"absolute",left:"-calc(var(--space-6) + 5px)",top:"4px",width:"10px",height:"10px",borderRadius:"50%",background:r.tag?"var(--primary)":"var(--border)",marginLeft:"-calc(var(--space-6) + 5px)",transform:"translateX(-50%)" }}/>
            <div style={{ display:"flex",alignItems:"center",gap:"var(--space-3)",marginBottom:"var(--space-3)" }}>
              <span style={{ fontFamily:"var(--font-display)",fontWeight:800,fontSize:"var(--text-base)" }}>{r.version}</span>
              {r.tag && <span style={{ fontSize:"var(--text-xs)",fontWeight:600,background:"var(--primary-hl)",color:"var(--primary)",padding:"2px var(--space-2)",borderRadius:"var(--radius-full)" }}>{r.tag}</span>}
              <span style={{ fontSize:"var(--text-xs)",color:"var(--text-faint)" }}>{r.date}</span>
            </div>
            <ul style={{ display:"flex",flexDirection:"column",gap:"var(--space-2)",paddingLeft:"var(--space-4)" }}>
              {r.changes.map(c=>(
                <li key={c} style={{ fontSize:"var(--text-sm)",color:"var(--text-muted)",listStyleType:"disc" }}>{c}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}