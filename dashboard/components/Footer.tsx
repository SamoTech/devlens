import Link from "next/link";
export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer style={{ borderTop:"1px solid var(--divider)",background:"var(--surface)",padding:"var(--space-10) var(--space-6)" }}>
      <div style={{ maxWidth:"1200px",margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:"var(--space-8)" }}>
        <div style={{ display:"flex",flexDirection:"column",gap:"var(--space-3)" }}>
          <div style={{ display:"flex",alignItems:"center",gap:"var(--space-2)" }}>
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="6" fill="var(--primary)"/>
              <circle cx="14" cy="14" r="6" fill="none" stroke="white" strokeWidth="2"/>
              <circle cx="14" cy="14" r="2" fill="white"/>
              <line x1="20" y1="20" x2="24" y2="24" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span style={{ fontFamily:"var(--font-display)",fontWeight:800,fontSize:"var(--text-sm)" }}>DevLens</span>
          </div>
          <p style={{ fontSize:"var(--text-xs)",color:"var(--text-muted)",maxWidth:"200px",lineHeight:1.6 }}>Repo health scoring in 9 dimensions. Free forever, live from GitHub API.</p>
          <p style={{ fontSize:"var(--text-xs)",color:"var(--text-faint)" }}>&copy; {year} SamoTech</p>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:"var(--space-2)" }}>
          <p style={{ fontSize:"var(--text-xs)",fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"var(--space-1)" }}>Product</p>
          {[["/","Analyze"],["/compare","Compare"],["/leaderboard","Leaderboard"],["/checked","Checked Repos"],["/security","Security Scanner"],["/docs","Docs"],["/changelog","Changelog"]].map(([href,label]) => (
            <Link key={href} href={href} style={{ fontSize:"var(--text-xs)",color:"var(--text-muted)",textDecoration:"none" }}>{label}</Link>
          ))}
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:"var(--space-2)" }}>
          <p style={{ fontSize:"var(--text-xs)",fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"var(--space-1)" }}>Community</p>
          {[["https://github.com/SamoTech/devlens","GitHub"],["https://github.com/SamoTech/devlens/issues","Issues"],["https://github.com/SamoTech/devlens/discussions","Discussions"],["/sponsor","Sponsor"]].map(([href,label]) => (
            <a key={href} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined} style={{ fontSize:"var(--text-xs)",color:"var(--text-muted)",textDecoration:"none" }}>{label}</a>
          ))}
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:"var(--space-2)" }}>
          <p style={{ fontSize:"var(--text-xs)",fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"var(--space-1)" }}>Legal</p>
          {[["/about","About"],["/faq","FAQ"],["/privacy","Privacy"],["/terms","Terms"],["/cookies","Cookies"]].map(([href,label]) => (
            <Link key={href} href={href} style={{ fontSize:"var(--text-xs)",color:"var(--text-muted)",textDecoration:"none" }}>{label}</Link>
          ))}
        </div>
      </div>
    </footer>
  );
}