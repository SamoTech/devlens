import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Privacy Policy | DevLens" };

const sections: [string, React.ReactNode][] = [
  ["Data We Collect",
    "When you analyze a repository, the repo slug, health score, description, and language are stored in Upstash Redis to power the Recently Checked list, Leaderboard, and Stats page. Historical score snapshots (up to 12 per repo) are also stored to power the trend chart. Your IP address is hashed and counted in a Redis set solely to compute the unique visitor count shown on the Stats page — it is never linked to any repo or personal identity."],
  ["What We Do NOT Collect",
    "We do not collect names, email addresses, private repo data, repository contents, or any personal information. No advertising profiles are built. No data is sold to third parties."],
  ["GitHub OAuth",
    "If you choose to sign in with GitHub, your GitHub OAuth token is stored in an encrypted server-side session cookie for the duration of your browser session only. It is used solely to raise your GitHub API rate limit from 60 to 5,000 requests/hour. It is never written to a database."],
  ["Cookies",
    "We use strictly necessary session cookies for GitHub OAuth only. No tracking, analytics, or advertising cookies are set. See our Cookies page for the full cookie table."],
  ["Third-Party Services",
    "We use Vercel for hosting (may log IP, path, user agent per their privacy policy) and Upstash Redis for data storage (data stored at rest in the EU or US region you configure). No other third-party analytics or tracking services are used."],
  ["Data Retention",
    "Watchlist entries are capped at 100 items (FIFO). History snapshots are capped at 12 per repo. Cached analysis results expire after 15 minutes. There is no long-term retention of repo data."],
  ["Contact",
    "For any privacy-related questions, please open an issue at github.com/SamoTech/devlens."],
];

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "var(--space-16) var(--space-6)" }}>
      <p style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)", marginBottom: "var(--space-4)" }}>
        <Link href="/" style={{ color: "var(--primary)", textDecoration: "none" }}>← Home</Link>
      </p>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 800, marginBottom: "var(--space-2)" }}>Privacy Policy</h1>
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
