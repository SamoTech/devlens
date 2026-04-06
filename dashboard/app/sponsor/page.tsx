import type { Metadata } from "next";
export const metadata: Metadata = { title: "Sponsor" };
export default function SponsorPage() {
  return (
    <div style={{ maxWidth:"640px",margin:"0 auto",padding:"var(--space-16) var(--space-6)",textAlign:"center" }}>
      <div style={{ fontSize:"3rem",marginBottom:"var(--space-4)" }}>💛</div>
      <h1 style={{ fontFamily:"var(--font-display)",fontSize:"var(--text-xl)",fontWeight:800,marginBottom:"var(--space-4)" }}>Support DevLens</h1>
      <p style={{ color:"var(--text-muted)",fontSize:"var(--text-base)",lineHeight:1.8,marginBottom:"var(--space-8)",maxWidth:"480px",margin:"0 auto var(--space-8)" }}>
        DevLens is free and open source. If it saves you time or helps your team ship better repos, consider sponsoring the project. Your support keeps the lights on and funds new features.
      </p>
      <div style={{ display:"flex",flexDirection:"column",gap:"var(--space-3)",alignItems:"center" }}>
        <a href="https://github.com/sponsors/SamoTech" target="_blank" rel="noopener noreferrer"
          style={{ display:"inline-flex",alignItems:"center",gap:"var(--space-2)",padding:"var(--space-3) var(--space-8)",background:"var(--primary)",color:"white",borderRadius:"var(--radius-lg)",fontWeight:700,fontSize:"var(--text-base)",textDecoration:"none" }}>
          ❤️ Sponsor on GitHub
        </a>
        <a href="https://github.com/SamoTech/devlens" target="_blank" rel="noopener noreferrer"
          style={{ display:"inline-flex",alignItems:"center",gap:"var(--space-2)",padding:"var(--space-3) var(--space-8)",border:"1px solid var(--border)",color:"var(--text)",borderRadius:"var(--radius-lg)",fontWeight:600,fontSize:"var(--text-base)",textDecoration:"none" }}>
          ⭐ Star on GitHub
        </a>
      </div>
      <div style={{ marginTop:"var(--space-12)",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:"var(--space-4)" }}>
        {[["🚀","Keep it free","Sponsorships keep DevLens free for everyone."],["🔧","Fund new features","More sponsors = faster development of new dimensions and integrations."],["🌍","Open source forever","DevLens will always be MIT-licensed and open source."]].map(([emoji,title,desc])=>(
          <div key={title} style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius-lg)",padding:"var(--space-5)",textAlign:"left" }}>
            <div style={{ fontSize:"1.5rem",marginBottom:"var(--space-2)" }}>{emoji}</div>
            <p style={{ fontWeight:700,fontSize:"var(--text-sm)",marginBottom:"var(--space-1)" }}>{title}</p>
            <p style={{ fontSize:"var(--text-xs)",color:"var(--text-muted)" }}>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}