import type { Metadata } from "next";
export const metadata: Metadata = { title: "About" };
export default function AboutPage() {
  return (
    <div style={{ maxWidth:"720px",margin:"0 auto",padding:"var(--space-16) var(--space-6)" }}>
      <h1 style={{ fontFamily:"var(--font-display)",fontSize:"var(--text-xl)",fontWeight:800,marginBottom:"var(--space-6)" }}>About DevLens</h1>
      <div style={{ display:"flex",flexDirection:"column",gap:"var(--space-5)",color:"var(--text-muted)",fontSize:"var(--text-base)",lineHeight:1.8 }}>
        <p>DevLens is a free, open-source tool that scores any public GitHub repository across 7 health dimensions — README quality, commit activity, freshness, documentation, CI/CD setup, issue response, and community signal.</p>
        <p>Every score is computed live from the GitHub API on each request. There is no database, no stored history, and no account required to analyze a public repo.</p>
        <p>The project was built by <a href="https://github.com/SamoTech" target="_blank" rel="noopener noreferrer" style={{ color:"var(--primary)" }}>SamoTech</a> as an open-source contribution to the developer community. The full source code is available on <a href="https://github.com/SamoTech/devlens" target="_blank" rel="noopener noreferrer" style={{ color:"var(--primary)" }}>GitHub</a>.</p>
        <h2 style={{ fontFamily:"var(--font-display)",fontSize:"var(--text-lg)",fontWeight:700,color:"var(--text)",marginTop:"var(--space-4)" }}>The 7 Dimensions</h2>
        <ul style={{ display:"flex",flexDirection:"column",gap:"var(--space-3)",paddingLeft:"var(--space-4)" }}>
          {[["📝 README Quality (20%)","Evaluates length, keyword coverage, code blocks, badges, and structural sections."],["🔥 Commit Activity (20%)","Counts commits in the last 90 days. 30+ commits = full score."],["🌿 Repo Freshness (15%)","Days since last push. Repos pushed within 7 days score 100."],["📚 Documentation (15%)","Checks for LICENSE, CONTRIBUTING, CHANGELOG, CODE_OF_CONDUCT, SECURITY, and a docs/ folder."],["⚙️ CI/CD Setup (15%)","Detects GitHub Actions workflows. 3+ workflows = full score."],["🎯 Issue Response (10%)","Ratio of closed to total issues. Fully closed = 100."],["⭐ Community Signal (5%)","Logarithmic score from stars and forks."]].map(([title,desc])=>(
            <li key={title}><strong style={{ color:"var(--text)" }}>{title}</strong> — {desc}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}