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
- GitHub OAuth sign-in to raise rate limit from 60 → 5,000 req/hr
- Dark / light mode with system preference + manual toggle

---

## Setup

```bash
cd dashboard
npm install
cp .env.example .env.local
# fill in .env.local (see below)
npm run dev
# → http://localhost:3000
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
# Required for: watchlist, leaderboard, history, stats, 15-min cache
# Free tier at: upstash.com
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# ── Optional ─────────────────────────────────────────────────────
# Server-side GitHub token — raises unauthenticated 60 req/hr limit
GITHUB_TOKEN=ghp_...
```

> **Without Redis** the app still analyzes repos, but watchlist, leaderboard, stats, history, and caching are silently skipped.

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
| Framework | Next.js 15 (App Router, TypeScript) |
| Auth | NextAuth v5 (GitHub OAuth) |
| Storage | Upstash Redis (REST client) |
| Hosting | Vercel |
| Data source | GitHub REST API v3 (public endpoints) |
| Styling | CSS custom properties (no Tailwind) |

---

## API Quick Reference

```bash
GET /api/analyze?repo=owner/name          # Full RepoReport JSON
GET /api/compare?a=owner/a&b=owner/b      # Two RepoReports
GET /api/history?repo=owner/name          # Weekly score snapshots
GET /api/watchlist                        # Recently checked repos
GET /api/org-watchlist                    # Recently checked orgs
GET /api/badge?repo=owner/name            # Badge URL + score
GET /api/stats                            # Usage stats
GET /api/leaderboard                      # Top scored repos
```

Full response shapes: [devlens-io.vercel.app/docs](https://devlens-io.vercel.app/docs)
