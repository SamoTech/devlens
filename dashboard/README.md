# DevLens Dashboard

> GitHub repo health scoring in 9 dimensions. Free forever, live from the GitHub API.
> Deployed at [devlens-io.vercel.app](https://devlens-io.vercel.app)

---

## Features

| Page | Route | Description |
|---|---|---|
| Analyze | `/` | Analyze any public repo, adjust dimension weights |
| Org | `/org` | Score all public repos in a GitHub org (up to 30) |
| Compare | `/compare` | Side-by-side two-repo comparison |
| Leaderboard | `/leaderboard` | Top-scoring repos from all DevLens users |
| Checked | `/checked` | Searchable list of recently analyzed repos |
| Badge | `/badge` | Live shields.io badge generator |
| Stats | `/stats` | Live usage stats: analyses, visitors, top repos, daily chart |
| Docs | `/docs` | Full API reference + scoring algorithm + self-hosting guide |
| Changelog | `/changelog` | Release history |
| Sponsor | `/sponsor` | Support the project |

**Core capabilities:**
- 9-dimension weighted scoring (README, Activity, Freshness, Docs, CI/CD, Issues, Community, PR Velocity, Security)
- Adjustable weight sliders — auto-normalize to 100%, custom-weight runs bypass cache
- 15-min Redis cache per repo; real weekly history snapshots (up to 12) for trend chart
- GitHub OAuth sign-in for authenticated GitHub API access; DevLens also enforces Redis-backed endpoint budgets
- Dark / light mode with system preference + manual toggle

---

## Setup

```bash
cd dashboard
npm ci
cp .env.example .env.local
# fill in .env.local (see below)
npm run dev
# → http://localhost:3000
```

Before opening a pull request, run the same local quality gates used by CI:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
npm audit --omit=dev
```

---

## Environment Variables

```env
# ── GitHub OAuth (Sign in with GitHub) ──────────────────────────
# Create at: github.com/settings/developers → OAuth Apps → New
# Callback URL: http://localhost:3000/api/auth/callback/github
AUTH_GITHUB_ID=your_oauth_app_client_id
AUTH_GITHUB_SECRET=your_oauth_app_client_secret
AUTH_SECRET=        # openssl rand -base64 32

# ── Upstash Redis ────────────────────────────────────────────────
# Required for: watchlist, leaderboard, history, stats, caching, and rate limits
# Free tier at: upstash.com
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# ── Optional ─────────────────────────────────────────────────────
# Optional server-side GitHub token for higher upstream API quota and security modules
GITHUB_TOKEN=ghp_...
```

> **Without Redis**, repository analysis may still run, but persistence-backed features and Redis-backed rate limiting are unavailable. The API reports degraded persistence/rate-limit behavior rather than treating missing data as a successful write.

---

## Deployment (Vercel)

1. Push `main` to GitHub
2. Import project in Vercel
3. Set **Root Directory** to `dashboard`
4. Add all env vars in **Project → Settings → Environment Variables**
5. Deploy — Vercel auto-detects Next.js

```bash
# Or deploy via CLI
vercel --cwd dashboard
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.3.1 (App Router, TypeScript) |
| Auth | NextAuth v5 (GitHub OAuth) |
| Storage | Upstash Redis (REST client) |
| Hosting | Vercel |
| Data source | GitHub REST API v3 (public endpoints) |
| Styling | CSS custom properties (no Tailwind) |

---

## API Quick Reference

Repository parameters accept either `owner/name` or a canonical `https://github.com/owner/name` URL. Other hosts, protocols, extra path segments, query strings, fragments, and control characters are rejected.

The security API returns explicit scanner states: `success`, `failed`, `unavailable`, `not_configured`, `rate_limited`, `timeout`, and `unauthorized`. An empty findings array is clean only when the corresponding scanner status is `success`.

Redis-backed budgets are intentionally endpoint-specific: analysis and history allow 30 requests/minute, advisory 10/minute, compare 10/minute, organization analysis 3/minute, security scans 5/minute, and watchlist operations 30/minute per authenticated identity or anonymous client IP. Exceeding a budget returns HTTP `429` with `Retry-After`; a Redis outage is reported as degraded protection.

```bash
GET /api/analyze?repo=owner/name          # Full RepoReport JSON
GET /api/compare?a=owner/a&b=owner/b      # Two RepoReports
GET /api/history?repo=owner/name          # Weekly score snapshots
GET /api/watchlist                        # Recently checked repos
GET /api/org-watchlist                    # Recently checked orgs
GET /api/badge/owner/name                 # SVG badge + score
GET /api/stats                            # Usage stats
GET /api/leaderboard                      # Top scored repos
```

Full response shapes: [devlens-io.vercel.app/docs](https://devlens-io.vercel.app/docs)
