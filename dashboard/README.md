# DevLens Dashboard

Next.js 15 web dashboard for DevLens — live GitHub repo health scores, trend charts, and side-by-side comparisons.

**Live:** https://devlens-io.vercel.app

## Stack

- **Next.js 15** (App Router, Edge Runtime)
- **TypeScript** + **Tailwind CSS v4**
- **Recharts** for trend charts
- **GitHub REST API** — live data on every request, no DB

## Features

| Feature | Route |
|---|---|
| Live score for any public repo | `/` |
| 7-dimension health table with progress bars | `/` |
| Historical trend chart (8-week simulated) | `/` |
| Compare two repos side by side | `/compare` |
| "Add to your repo" copy-paste snippet | modal on result card |
| Dark / light mode | everywhere |

## Local Development

```bash
cd dashboard
npm install
cp .env.example .env.local
# Fill in GITHUB_TOKEN for higher rate limits (optional)
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel

```bash
vercel --cwd dashboard
```

Set these in Vercel project settings:

| Variable | Required | Notes |
|---|---|---|
| `GITHUB_TOKEN` | Recommended | Raises API limit 60 → 5,000 req/hr |

## API Routes

| Route | Description |
|---|---|
| `GET /api/analyze?repo=owner/name` | Full 7-dimension analysis |
| `GET /api/compare?a=owner/a&b=owner/b` | Parallel analysis of two repos |
| `GET /api/history?repo=owner/name` | Current score + 8-week trend |

All routes run on **Edge Runtime** and are cached for 5 minutes.
