import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "FAQ | DevLens" };

const faqs: [string, React.ReactNode][] = [
  ["Is DevLens free?",
    "Yes, completely free. There are no paid tiers and no account required to analyze public repositories."],
  ["Does DevLens store any data?",
    "Partially. Repo slugs, health scores, language, and description are saved to Upstash Redis to power the Recently Checked list, Leaderboard, and Stats page. Historical snapshots (up to 12 per repo) are stored to show the trend chart. No personal data, private repo data, or full repo contents are ever stored."],
  ["How often does the score update?",
    "On every analysis. Results are cached in Redis for 15 minutes per repo. Custom-weight runs always bypass the cache and return a live score."],
  ["Why is my score lower than I expected?",
    "Common culprits: fewer than 30 commits in the last 90 days (Activity), missing docs files like CONTRIBUTING.md or SECURITY.md (Documentation), a README under 1,500 characters (README Quality), no GitHub Actions workflows (CI/CD), or slow PR merge times (PR Velocity)."],
  ["Can I analyze private repos?",
    "Not currently. DevLens only scores public GitHub repositories via the unauthenticated GitHub API. Sign in with GitHub if you hit the 60 req/hr rate limit."],
  ["What is the GitHub API rate limit?",
    "Unauthenticated: 60 requests/hour per IP. If you sign in with GitHub OAuth (or set GITHUB_TOKEN in a self-hosted instance), you get 5,000 requests/hour."],
  ["How do I add the DevLens badge to my README?",
    "Analyze your repo, then click \"Add to your repo →\" on the result card. Copy the badge markdown and optionally the GitHub Actions workflow to keep it updated on every push."],
  ["Can I adjust how each dimension is weighted?",
    "Yes. Expand the Adjust Weights panel on the home page before analyzing. Drag the sliders to redistribute importance across all 9 dimensions — they auto-normalize to 100%."],
  ["What is Org analysis?",
    "The /org page lets you enter any GitHub org slug (e.g. vercel) and DevLens will score up to 30 of its public repos concurrently, then rank them by health score."],
  ["Is the source code available?",
    "Yes. DevLens is fully open source at github.com/SamoTech/devlens under the MIT license."],
];

export default function FAQPage() {
  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "var(--space-16) var(--space-6)" }}>
      <p style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)", marginBottom: "var(--space-4)" }}>
        <Link href="/" style={{ color: "var(--primary)", textDecoration: "none" }}>← Home</Link>
      </p>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 800, marginBottom: "var(--space-2)" }}>Frequently Asked Questions</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "var(--space-10)", fontSize: "var(--text-sm)" }}>Everything you need to know about DevLens.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        {faqs.map(([q, a], i) => (
          <div key={i} style={{ padding: "var(--space-6) 0", borderBottom: "1px solid var(--divider)" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-base)", fontWeight: 700, marginBottom: "var(--space-2)" }}>{q}</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", lineHeight: 1.8 }}>{a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
