import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "About | DevLens" };

const DIMS = [
  ["📝", "README Quality",   "20%", "Evaluates length, keyword coverage (install, usage, license, etc.), code blocks, images, headings, checklists, and DevLens marker."],
  ["⚡", "Commit Activity",   "20%", "Counts commits to the default branch in the last 90 days. 30+ commits = 100."],
  ["🌿", "Repo Freshness",    "15%", "Days since last push. Repos pushed within 7 days score 100."],
  ["📚", "Documentation",     "15%", "Checks for LICENSE, CONTRIBUTING.md, CHANGELOG.md, CODE_OF_CONDUCT.md, SECURITY.md, and a docs/ folder — 16 pts each."],
  ["⚙️", "CI/CD Setup",       "10%", "Detects GitHub Actions workflows. 3+ = 100, 1+ = 60, 0 = 0."],
  ["🎯", "Issue Response",    "10%", "Ratio of closed to total issues × 100. No issues at all = 100."],
  ["⭐", "Community Signal",  "5%",  "Logarithmic score from stars and forks: log1p(stars)×15 + log1p(forks)×10, capped at 100."],
  ["🔀", "PR Velocity",       "3%",  "Average time to merge a pull request across the last 20 closed PRs. <1 day = 100 down to >30 days = 10."],
  ["🔒", "Security",          "2%",  "Detects SECURITY.md (+30), Dependabot config (+35), and CodeQL / Trivy / Snyk workflows (+35)."],
];

export default function AboutPage() {
  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "var(--space-16) var(--space-6)" }}>
      <p style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)", marginBottom: "var(--space-4)" }}>
        <Link href="/" style={{ color: "var(--primary)", textDecoration: "none" }}>← Home</Link>
      </p>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 800, marginBottom: "var(--space-6)" }}>About DevLens</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", color: "var(--text-muted)", fontSize: "var(--text-base)", lineHeight: 1.8 }}>
        <p>
          DevLens is a free, open-source tool that scores any public GitHub repository across{" "}
          <strong style={{ color: "var(--text)" }}>9 health dimensions</strong> — README quality, commit activity,
          freshness, documentation, CI/CD setup, issue response, community signal, PR velocity, and security.
        </p>
        <p>
          Every score is computed live from the GitHub API. Scores without custom weights are cached for 15 minutes
          in Upstash Redis. Historical snapshots are stored per-repo to power the trend chart over time.
          No account is required to analyze a public repo.
        </p>
        <p>
          The project was built by{" "}
          <a href="https://github.com/SamoTech" target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)" }}>SamoTech</a>
          {" "}as an open-source contribution to the developer community. The full source code is available on{" "}
          <a href="https://github.com/SamoTech/devlens" target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)" }}>GitHub</a>
          {" "}under the MIT license.
        </p>

        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--text)", marginTop: "var(--space-4)" }}>The 9 Dimensions</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Dimension", "Weight", "What it measures"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "var(--space-2) var(--space-3)", fontWeight: 700, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DIMS.map(([emoji, title, weight, desc], i) => (
                <tr key={title} style={{ borderBottom: "1px solid var(--divider)", background: i % 2 === 0 ? "transparent" : "var(--surface)" }}>
                  <td style={{ padding: "var(--space-3)", fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap" }}>{emoji} {title}</td>
                  <td style={{ padding: "var(--space-3)", fontWeight: 700, color: "var(--primary)", whiteSpace: "nowrap" }}>{weight}</td>
                  <td style={{ padding: "var(--space-3)", color: "var(--text-muted)" }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ fontSize: "var(--text-sm)" }}>
          Weights sum to 100%. You can adjust them using the weight sliders on the{" "}
          <Link href="/" style={{ color: "var(--primary)" }}>home page</Link> before analyzing.
          Custom-weight runs bypass the cache and always return a fresh score.
        </p>
      </div>
    </div>
  );
}
