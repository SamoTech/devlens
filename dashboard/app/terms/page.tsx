import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Terms of Service | DevLens" };

const sections: [string, string][] = [
  ["1. Use of Service",
    "DevLens is provided free of charge for personal and commercial use. You may use the service to analyze any public GitHub repository. You may not use the service to circumvent GitHub API rate limits, scrape data in bulk, or cause unreasonable load on the service."],
  ["2. No Warranty",
    "DevLens is provided \"as is\" without warranty of any kind. Scores are computed from publicly available GitHub API data and are indicative only. SamoTech makes no guarantees about the accuracy, completeness, or fitness for purpose of the scores."],
  ["3. GitHub API",
    "DevLens relies on the GitHub API. Your use of DevLens is also subject to GitHub's Terms of Service. We do not store your GitHub credentials or private repository data."],
  ["4. Data Storage",
    "By using DevLens, you acknowledge that repo slugs, health scores, and related public metadata may be stored in Upstash Redis to power the Recently Checked list, Leaderboard, Stats, and trend history features. Only public GitHub data is stored."],
  ["5. Limitations of Liability",
    "To the fullest extent permitted by law, SamoTech shall not be liable for any indirect, incidental, or consequential damages arising from your use of DevLens."],
  ["6. Changes",
    "We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of the updated terms."],
];

export default function TermsPage() {
  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "var(--space-16) var(--space-6)" }}>
      <p style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)", marginBottom: "var(--space-4)" }}>
        <Link href="/" style={{ color: "var(--primary)", textDecoration: "none" }}>← Home</Link>
      </p>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 800, marginBottom: "var(--space-2)" }}>Terms of Service</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", marginBottom: "var(--space-10)" }}>Last updated: April 2026</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)", color: "var(--text-muted)", fontSize: "var(--text-sm)", lineHeight: 1.8 }}>
        {sections.map(([title, body]) => (
          <div key={title}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--text)", marginBottom: "var(--space-2)" }}>{title}</h2>
            <p>{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
