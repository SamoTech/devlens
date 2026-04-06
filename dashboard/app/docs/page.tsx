import type { Metadata } from "next";
export const metadata: Metadata = { title: "Docs" };
export default function DocsPage() {
  return (
    <div style={{ maxWidth:"720px",margin:"0 auto",padding:"var(--space-16) var(--space-6)" }}>
      <h1 style={{ fontFamily:"var(--font-display)",fontSize:"var(--text-xl)",fontWeight:800,marginBottom:"var(--space-2)" }}>Documentation</h1>
      <p style={{ color:"var(--text-muted)",marginBottom:"var(--space-10)" }}>Everything you need to integrate DevLens into your workflow.</p>
      <div style={{ display:"flex",flexDirection:"column",gap:"var(--space-10)" }}>
        {[
          { title:"Quick Start", content:[
            ["1. Analyze any repo","Paste a GitHub repo URL (e.g. vercel/next.js) into the search bar on the home page and click Analyze."],
            ["2. Read the report","The 7-row health table shows your score per dimension with color-coded progress bars. The trend chart shows simulated history."],
            ["3. Add to your README","Click \"Add to your repo →\" to get the copy-paste README marker and GitHub Actions workflow."],
          ]},
          { title:"API Reference", content:[
            ["GET /api/analyze?repo=owner/name","Returns a full RepoReport JSON object with health_score, scores (7 dimensions), stars, forks, language, and badge_url."],
            ["GET /api/compare?a=owner/a&b=owner/b","Returns { a: RepoReport, b: RepoReport } for side-by-side comparison."],
            ["GET /api/history?repo=owner/name","Returns { current: RepoReport, history: [{week, score}] } with 8 simulated weekly data points."],
          ]},
          { title:"Self-Hosting", content:[
            ["Clone the repo","git clone https://github.com/SamoTech/devlens && cd devlens/dashboard"],
            ["Install dependencies","npm install"],
            ["Set environment variables","Copy .env.example to .env.local and fill in AUTH_GITHUB_ID, AUTH_GITHUB_SECRET, AUTH_SECRET, and optionally GITHUB_TOKEN."],
            ["Run locally","npm run dev — the dashboard runs at http://localhost:3000"],
            ["Deploy to Vercel","vercel --cwd dashboard — then set the same env vars in your Vercel project settings."],
          ]},
          { title:"Scoring Algorithm", content:[
            ["Weights","README 20% + Activity 20% + Freshness 15% + Docs 15% + CI 15% + Issues 10% + Community 5% = 100"],
            ["README (max 100)","Points for length (10+5+5), keywords like install/usage/license/contributing/feature/example (6 each), code blocks (8), images (6), section headings (4), checklists (4), DevLens marker (6), setup/roadmap/sponsor/discord mentions (4 each)."],
            ["Activity (max 100)","30+ commits in 90 days = 100. 15+ = 75. 5+ = 50. 1+ = 25. 0 = 0."],
            ["Freshness (max 100)","≤7 days = 100. ≤30 = 80. ≤90 = 55. ≤180 = 30. Older = 10."],
            ["Docs (max 100)","16 points each for: LICENSE, CONTRIBUTING.md, CHANGELOG.md, CODE_OF_CONDUCT.md, SECURITY.md, docs/ folder."],
            ["CI (max 100)","3+ workflows = 100. 1+ = 60. 0 = 0."],
            ["Issues (max 100)","Ratio of closed to total issues × 100."],
            ["Community (max 100)","log1p(stars)×15 + log1p(forks)×10, capped at 100."],
          ]},
        ].map(section=>(
          <div key={section.title}>
            <h2 style={{ fontFamily:"var(--font-display)",fontSize:"var(--text-lg)",fontWeight:700,marginBottom:"var(--space-5)",paddingBottom:"var(--space-3)",borderBottom:"1px solid var(--divider)" }}>{section.title}</h2>
            <div style={{ display:"flex",flexDirection:"column",gap:"var(--space-4)" }}>
              {section.content.map(([title,body])=>(
                <div key={title}>
                  <p style={{ fontWeight:600,fontSize:"var(--text-sm)",color:"var(--text)",marginBottom:"var(--space-1)",fontFamily: title.startsWith("GET")?"monospace":"inherit" }}>{title}</p>
                  <p style={{ fontSize:"var(--text-sm)",color:"var(--text-muted)",lineHeight:1.7 }}>{body}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}