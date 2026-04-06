# DevLens Dashboard

> GitHub repo health scorer — 9 dimensions, live analysis, free forever.

## Features (v2)

- **9-dimension scoring**: README, Activity, Freshness, Docs, CI/CD, Issues, Community, PR Velocity, Security
- **Redis caching** (Upstash): 15-min cache per repo, real trend history up to 12 weeks
- **Shareable report pages**: `/report/{owner}/{repo}`
- **Badge generator**: `/badge` — Markdown, HTML, raw URL snippets
- **Org leaderboard**: `/org` — score all public repos in an org
- **Compare mode**: `/compare` — side-by-side repo comparison
- **Rate limit CTA**: yellow banner with GitHub sign-in when API quota is hit
- **Weight customization**: adjust dimension weights via sliders
- **Dark/light mode**

## Setup

```bash
cd dashboard
npm install
cp .env.example .env.local
# fill in .env.local
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `AUTH_SECRET` | Yes | NextAuth secret (`openssl rand -base64 32`) |
| `GITHUB_ID` | Yes | GitHub OAuth App client ID |
| `GITHUB_SECRET` | Yes | GitHub OAuth App client secret |
| `GITHUB_TOKEN` | Optional | Server-side GitHub PAT (increases rate limit) |
| `UPSTASH_REDIS_REST_URL` | Optional | Upstash Redis REST URL — enables caching & history |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | Upstash Redis REST token |

> Without Redis env vars the app works fine — caching and history are silently skipped.

## Deployment (Vercel)

1. Push `main` to GitHub
2. Import project in Vercel, set root directory to `dashboard/`
3. Add all env vars in Vercel project settings
4. Deploy
