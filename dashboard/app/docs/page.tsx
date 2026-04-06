import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Docs | DevLens" };

const CODE: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize: "var(--text-xs)",
  background: "var(--surface-off, var(--surface-2))",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  padding: "var(--space-1) var(--space-2)",
  display: "inline-block",
  color: "var(--text)",
};

const PRE: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize: "var(--text-xs)",
  background: "var(--surface-off, var(--surface-2))",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  padding: "var(--space-4)",
  overflowX: "auto",
  lineHeight: 1.7,
  color: "var(--text)",
  whiteSpace: "pre",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 700, paddingBottom: "var(--space-3)", borderBottom: "1px solid var(--divider)" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontWeight: 600, fontSize: "var(--text-sm)", marginBottom: "var(--space-1)" }}>{label}</p>
      <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", lineHeight: 1.8 }}>{children}</div>
    </div>
  );
}

const DIMS = [
  { key: "readme",      weight: "20%", title: "README Quality",  desc: "Scores length (10 + 5 + 5 pts for 500 / 1500 / 3000 chars), presence of keywords install, usage, license, contributing, feature, example (6 pts each), code blocks (8), images (6), ## headings (4), list items (4), setup / roadmap / sponsor / discord mentions (4 each). Max 100." },
  { key: "activity",    weight: "20%", title: "Commit Activity",  desc: "Counts commits to the default branch in the last 90 days via the GitHub Commits API. ≥30 = 100 · ≥15 = 75 · ≥5 = 50 · ≥1 = 25 · 0 = 0." },
  { key: "freshness",   weight: "15%", title: "Repo Freshness",   desc: "Days since last push to the default branch (pushed_at field). ≤7 days = 100 · ≤30 = 80 · ≤90 = 55 · ≤180 = 30 · older = 10." },
  { key: "docs",        weight: "15%", title: "Documentation",    desc: "Walks the full repo tree (git/trees/HEAD?recursive=1) looking for: LICENSE, CONTRIBUTING.md, CHANGELOG.md, CODE_OF_CONDUCT.md, SECURITY.md, docs/ folder — 16 pts each, max 100." },
  { key: "ci",          weight: "10%", title: "CI/CD Setup",      desc: "Counts GitHub Actions workflow files via the Actions Workflows API. ≥3 workflows = 100 · ≥1 = 60 · 0 = 0." },
  { key: "issues",      weight: "10%", title: "Issue Response",   desc: "Fetches up to 50 closed issues and compares against open_issues_count. Score = round(closed / total × 100). No issues at all = 100." },
  { key: "community",   weight: "5%",  title: "Community Signal", desc: "Math.min(Math.floor(log1p(stars) × 15) + Math.floor(log1p(forks) × 10), 100). Rewards repos with organic momentum." },
  { key: "pr_velocity", weight: "3%",  title: "PR Velocity",      desc: "Fetches last 20 closed PRs, filters to merged ones, averages (merged_at − created_at). <1 day = 100 · <3 = 85 · <7 = 65 · <14 = 45 · <30 = 25 · else = 10. No merged PRs = 50." },
  { key: "security",    weight: "2%",  title: "Security",         desc: "Walks the repo tree for SECURITY.md (+30), .github/dependabot.yml (+35), and any workflow containing codeql / trivy / snyk (+35). Max 100." },
];

export default function DocsPage() {
  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "var(--space-16) var(--space-6)" }}>
      <p style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)", marginBottom: "var(--space-4)" }}>
        <Link href="/" style={{ color: "var(--primary)", textDecoration: "none" }}>← Home</Link>
      </p>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 800, marginBottom: "var(--space-2)" }}>Documentation</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "var(--space-12)", fontSize: "var(--text-sm)" }}>Complete technical reference for DevLens — scoring algorithm, API, self-hosting, and integration guides.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-12)" }}>

        {/* ── Quick Start ── */}
        <Section title="Quick Start">
          <Row label="1. Analyze any repo">
            Paste a GitHub URL or <code style={CODE}>owner/name</code> slug (e.g. <code style={CODE}>vercel/next.js</code>) into the search bar on the{" "}
            <Link href="/" style={{ color: "var(--primary)" }}>home page</Link> and click <strong>Analyze</strong>.
            The result is fetched live from the GitHub API — no cache for custom-weighted runs.
          </Row>
          <Row label="2. Read the report">
            The health report shows a weighted <strong>Health Score / 100</strong> plus a breakdown across all 9 dimensions with color-coded bars
            (green ≥ 80, amber ≥ 50, red below 50). A trend chart appears if historical snapshots exist for the repo.
            Actionable suggestions are listed for every dimension scoring below 80.
          </Row>
          <Row label="3. Adjust weights">
            Expand the <strong>Adjust Weights</strong> panel before analyzing. Drag each slider to redistribute importance
            across the 9 dimensions. Weights are normalized to sum to 100% automatically.
            Custom weights bypass the Redis cache so you always get a fresh score.
          </Row>
          <Row label="4. Badge &amp; README marker">
            Click <strong>Add to your repo →</strong> on any report to copy the README badge markdown and the
            optional GitHub Actions workflow that re-runs DevLens on every push.
          </Row>
          <Row label="5. Org analysis">
            Visit <Link href="/org" style={{ color: "var(--primary)" }}>/org</Link> and enter an org slug (e.g. <code style={CODE}>vercel</code>).
            DevLens fetches up to 30 public repos, scores each one concurrently, and ranks them by health score.
          </Row>
        </Section>

        {/* ── API Reference ── */}
        <Section title="API Reference">
          <Row label="GET /api/analyze?repo=owner/name">
            Returns a <code style={CODE}>RepoReport</code> JSON object. Cached in Redis for 15 minutes unless{" "}
            <code style={CODE}>weights</code> param is present.
            <br /><br />
            <strong>Query params:</strong>
            <ul style={{ marginTop: "var(--space-2)", paddingLeft: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
              <li><code style={CODE}>repo</code> <em>(required)</em> — <code style={CODE}>owner/name</code> or full GitHub URL</li>
              <li><code style={CODE}>weights</code> <em>(optional)</em> — URL-encoded JSON of <code style={CODE}>{`{readme:0.2, activity:0.2, ...}`}</code></li>
            </ul>
            <br />
            <strong>Response shape:</strong>
            <pre style={PRE}>{`{
  repo:        "vercel/next.js",
  owner:       "vercel",
  name:        "next.js",
  description: string | null,
  stars:       number,
  forks:       number,
  language:    string | null,
  avatar:      string,          // owner avatar URL
  url:         string,          // github.com URL
  healthScore: number,          // 0–100 weighted final score
  scores: {
    readme: number, activity: number, freshness: number,
    docs: number, ci: number, issues: number,
    community: number, pr_velocity: number, security: number
  },
  suggestions: [{ dim: string, message: string }],
  badgeUrl:    string,          // shields.io badge URL
  generatedAt: string           // ISO 8601
}`}</pre>
          </Row>

          <Row label="GET /api/compare?a=owner/a&b=owner/b">
            Runs two concurrent <code style={CODE}>/api/analyze</code> calls and returns both reports.
            <pre style={PRE}>{`{ a: RepoReport, b: RepoReport }`}</pre>
          </Row>

          <Row label="GET /api/history?repo=owner/name">
            Returns up to 12 historical weekly snapshots stored in Redis whenever the repo is analyzed (without custom weights).
            <pre style={PRE}>{`{
  history: [
    { week: "W04-07", score: 74, date: "2026-04-07T..." },
    ...
  ]
}`}</pre>
          </Row>

          <Row label="GET /api/watchlist">
            Returns the last 100 repos analyzed by any DevLens visitor — powers the <Link href="/checked" style={{ color: "var(--primary)" }}>Checked</Link> and home page recent lists.
            <pre style={PRE}>{`{ list: [{ slug, score, description, language, savedAt }] }`}</pre>
          </Row>

          <Row label="GET /api/org-watchlist">
            Returns the last 50 orgs analyzed, with per-org repo count, avg score, and top repo.
            <pre style={PRE}>{`{ list: [{ org, repoCount, avgScore, topRepo, savedAt }] }`}</pre>
          </Row>

          <Row label="GET /api/stats">
            Returns live usage stats aggregated from Redis: total analyses, unique visitors, daily activity (last 30 days),
            top repos by hit count, top orgs, avg health score, and top language.
            <pre style={PRE}>{`{
  totalAnalyses: number,
  analysesToday: number,
  uniqueVisitors: number,
  totalReposChecked: number,
  totalOrgsChecked: number,
  avgScore: number | null,
  topLanguage: string | null,
  topRepos: [{ slug, count, score, lastSeen }],
  topOrgs:  [{ org, repoCount, avgScore, topRepo, savedAt }],
  dailyActivity: [{ date: "YYYY-MM-DD", count: number }]
}`}</pre>
          </Row>

          <Row label="GET /api/leaderboard">
            Returns repos ranked by health score from the watchlist.
            <pre style={PRE}>{`{ list: [{ slug, score, description, language, savedAt }] }`}</pre>
          </Row>

          <Row label="GET /api/badge?repo=owner/name">
            Returns a JSON object with a <code style={CODE}>badgeUrl</code> (shields.io) and the current <code style={CODE}>healthScore</code>.
            Embeddable directly in any README.
          </Row>
        </Section>

        {/* ── Scoring Algorithm ── */}
        <Section title="Scoring Algorithm">
          <Row label="How the final score is calculated">
            Each of the 9 dimensions returns a raw score 0–100. The final{" "}
            <code style={CODE}>healthScore</code> is a weighted average:
            <pre style={PRE}>{`healthScore = Σ (dimScoreᵢ × weightᵢ)   where Σ weightᵢ = 1`}</pre>
            Default weights are listed below. Users can override them via the UI weight sliders or the{" "}
            <code style={CODE}>weights</code> query param — they are re-normalized automatically.
          </Row>

          {/* Dimension table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-xs)" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Dimension", "Key", "Default Weight", "Data Source", "Score Logic"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "var(--space-2) var(--space-3)", fontWeight: 700, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DIMS.map((d, i) => (
                  <tr key={d.key} style={{ background: i % 2 === 0 ? "transparent" : "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "var(--space-3)", fontWeight: 600, whiteSpace: "nowrap" }}>{d.title}</td>
                    <td style={{ padding: "var(--space-3)" }}><code style={CODE}>{d.key}</code></td>
                    <td style={{ padding: "var(--space-3)", fontWeight: 700, color: "var(--primary)", whiteSpace: "nowrap" }}>{d.weight}</td>
                    <td style={{ padding: "var(--space-3)", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{
                      d.key === "readme" ? "repos/{owner}/{name}/readme" :
                      d.key === "activity" ? "repos/.../commits?since=90d" :
                      d.key === "freshness" ? "repo.pushed_at" :
                      d.key === "docs" ? "git/trees/HEAD?recursive" :
                      d.key === "ci" ? "actions/workflows" :
                      d.key === "issues" ? "issues?state=closed" :
                      d.key === "community" ? "repo.stargazers_count" :
                      d.key === "pr_velocity" ? "pulls?state=closed" :
                      "git/trees/HEAD?recursive"
                    }</td>
                    <td style={{ padding: "var(--space-3)", color: "var(--text-muted)", maxWidth: 320 }}>{d.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Row label="Caching">
            Successful analyses (without custom weights) are cached in Upstash Redis for <strong>15 minutes</strong> under{" "}
            <code style={CODE}>cache:{`{owner}:{name}`}</code>. Historical snapshots are appended to{" "}
            <code style={CODE}>history:{`{owner}:{name}`}</code> and kept for the last 12 data points.
            Custom-weight runs bypass the cache entirely to return a fresh score.
          </Row>

          <Row label="Rate limiting">
            Unauthenticated GitHub API calls are limited to <strong>60 req/hour per IP</strong>.
            Signing in with GitHub (“Sign in with GitHub” button on rate-limit error) grants <strong>5,000 req/hour</strong> via OAuth token.
            Self-hosters can set <code style={CODE}>GITHUB_TOKEN</code> in env vars as a fallback token for server-side calls.
          </Row>
        </Section>

        {/* ── Self-Hosting ── */}
        <Section title="Self-Hosting">
          <Row label="Prerequisites">
            Node.js ≥20, an Upstash Redis database (free tier works), a GitHub OAuth App for auth, and optionally a <code style={CODE}>GITHUB_TOKEN</code> for server-side API calls.
          </Row>

          <Row label="Clone &amp; install">
            <pre style={PRE}>{`git clone https://github.com/SamoTech/devlens
cd devlens/dashboard
npm install`}</pre>
          </Row>

          <Row label="Environment variables">
            Copy <code style={CODE}>.env.example</code> to <code style={CODE}>.env.local</code> and fill in:
            <pre style={PRE}>{`# GitHub OAuth (for Sign in with GitHub)
AUTH_GITHUB_ID=your_oauth_app_client_id
AUTH_GITHUB_SECRET=your_oauth_app_client_secret
AUTH_SECRET=any_random_32char_string

# Upstash Redis (required for watchlist, history, stats)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Optional — server-side fallback GitHub token (60 → 5000 req/hr)
GITHUB_TOKEN=ghp_...`}</pre>
          </Row>

          <Row label="Run locally">
            <pre style={PRE}>{`npm run dev
# → http://localhost:3000`}</pre>
          </Row>

          <Row label="Deploy to Vercel">
            <pre style={PRE}>{`vercel --cwd dashboard
# Then add all env vars in Vercel → Project → Settings → Environment Variables`}</pre>
            The project root is <code style={CODE}>dashboard/</code>. Set the <strong>Root Directory</strong> to <code style={CODE}>dashboard</code> in Vercel project settings.
          </Row>

          <Row label="GitHub OAuth App setup">
            Go to <strong>GitHub → Settings → Developer settings → OAuth Apps → New OAuth App</strong>.
            Set <em>Homepage URL</em> to your domain and <em>Authorization callback URL</em> to{" "}
            <code style={CODE}>https://yourdomain.com/api/auth/callback/github</code>.
            Copy the Client ID and Secret into your env vars.
          </Row>
        </Section>

        {/* ── Integrations ── */}
        <Section title="Integrations">
          <Row label="README badge">
            Get a live shields.io badge from <code style={CODE}>/api/badge?repo=owner/name</code> and paste into your README:
            <pre style={PRE}>{`[![DevLens Health](https://devlens-io.vercel.app/api/badge?repo=owner/name)]
(https://devlens-io.vercel.app/?repo=owner/name)`}</pre>
          </Row>

          <Row label="GitHub Actions workflow">
            Add the following workflow to re-score your repo on every push to main:
            <pre style={PRE}>{`# .github/workflows/devlens.yml
name: DevLens Health Check
on:
  push:
    branches: [main]
  schedule:
    - cron: "0 9 * * 1"   # every Monday at 09:00 UTC

jobs:
  score:
    runs-on: ubuntu-latest
    steps:
      - name: Fetch DevLens score
        run: |
          curl -s "https://devlens-io.vercel.app/api/analyze?repo=\${{ github.repository }}" \
            | jq '.healthScore'`}</pre>
          </Row>

          <Row label="Org-level analysis">
            The <Link href="/org" style={{ color: "var(--primary)" }}>/org</Link> page (or <code style={CODE}>/api/org?org=orgname</code> if you build a custom client)
            scores up to 30 public repos concurrently and ranks by health score, giving a portfolio-level view of repo health.
          </Row>
        </Section>

        {/* ── Data &amp; Privacy ── */}
        <Section title="Data &amp; Privacy">
          <Row label="What DevLens stores">
            DevLens stores <strong>only public GitHub data</strong> in Upstash Redis:
            <ul style={{ marginTop: "var(--space-2)", paddingLeft: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
              <li>Repo slug, health score, description, language, and timestamp — for the recently-checked and leaderboard lists</li>
              <li>Per-repo hit counts and daily analysis counts — for the stats page</li>
              <li>Hashed/raw visitor IPs in a Redis set — for unique visitor count only</li>
              <li>Historical score snapshots per repo — for the trend chart</li>
            </ul>
            No private repo data, no user emails, no personal data beyond IP for visit counting.
          </Row>
          <Row label="Retention">
            Cached reports expire after <strong>15 minutes</strong>. Watchlist and stats data have no automatic TTL
            but are bounded (watchlist capped at 100 entries, history at 12 points per repo).
          </Row>
        </Section>

      </div>
    </div>
  );
}
