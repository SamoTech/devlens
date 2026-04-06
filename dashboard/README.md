# DevLens Dashboard

Next.js 15 web dashboard for DevLens — live repo health scoring across **9 dimensions**, trend charts, side-by-side comparison, org-level analysis, and embeddable badges.

## Features

- **Live scoring** — paste any public repo URL, get a score in seconds
- **9-dimension health table** with animated progress bars
- **Health trend chart** — real 12-week history (stored in Redis)
- **Compare mode** — side-by-side dimension breakdown for two repos
- **Org view** — score and rank all public repos in a GitHub org
- **Shareable report pages** — `/report/:owner/:repo` with OG metadata
- **Badge generator** — `/badge` page with Markdown, HTML, and URL embed codes
- **Score improvement suggestions** — actionable tips per dimension
- **Weight customization** — adjust dimension weights with sliders
- **Snippet modal** — copy-paste Quick Start for any repo
- **Dark/light mode** — system preference + manual toggle
- **GitHub OAuth** — higher rate limits when signed in
- **Response caching** — Redis cache (5min TTL) to reduce GitHub API usage

## Dimensions

| # | Dimension | Weight | What it measures |
|---|-----------|--------|------------------|
| 1 | 📄 README Quality | 20% | Length, sections, badges, code blocks |
| 2 | ⚡ Commit Activity | 20% | Push frequency over last 90 days |
| 3 | 🕐 Repo Freshness | 10% | Days since last push |
| 4 | 📚 Documentation | 10% | LICENSE, CONTRIBUTING, CHANGELOG, SECURITY |
| 5 | 🔧 CI/CD Setup | 10% | GitHub Actions workflows |
| 6 | 🐛 Issue Response | 10% | Closed vs open issue ratio |
| 7 | ⭐ Community Signal | 5% | Stars and forks |
| 8 | 🔀 PR Velocity | 10% | Average PR merge time |
| 9 | 🔒 Security | 5% | SECURITY.md, Dependabot, CodeQL |

## Setup

```bash
cd dashboard
npm install
cp .env.example .env.local
# Fill in .env.local
npm run dev
# Open http://localhost:3000
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_GITHUB_ID` | Yes (OAuth) | GitHub OAuth App client ID |
| `AUTH_GITHUB_SECRET` | Yes (OAuth) | GitHub OAuth App client secret |
| `AUTH_SECRET` | Yes | Random 32-char secret for next-auth |
| `GITHUB_TOKEN` | Recommended | Personal access token (fallback for rate limits) |
| `NEXTAUTH_URL` | Yes | Base URL (e.g. `http://localhost:3000`) |
| `UPSTASH_REDIS_REST_URL` | Recommended | Upstash Redis REST URL (free tier works) |
| `UPSTASH_REDIS_REST_TOKEN` | Recommended | Upstash Redis REST token |

Create a free Redis instance at [upstash.com](https://upstash.com). Without Redis, history falls back to current-score-only and caching is disabled.

## Deploy to Vercel

```bash
vercel --cwd dashboard
```

Set all env vars from `.env.example` in your Vercel project settings.

## Stack

- **Next.js 15** App Router, TypeScript
- **@upstash/redis** for caching and trend history
- **Recharts** for trend charts
- **Lucide React** for icons
- **next-auth v5** for GitHub OAuth
- No traditional database — live GitHub API + Redis cache
