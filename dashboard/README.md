# DevLens Dashboard

Next.js 15 web dashboard for DevLens — live repo health scoring, trend charts, and side-by-side comparison.

## Features

- 🔍 **Live scoring** — paste any public repo URL, get a score in seconds
- 📊 **7-row health table** with animated progress bars
- 📈 **Health trend chart** — 8-week history
- ⚖️ **Compare mode** — side-by-side dimension breakdown
- 📋 **Snippet modal** — copy-paste Quick Start for any repo
- 🌙 **Dark/light mode** — system preference + manual toggle
- 🔐 **GitHub OAuth** — higher rate limits when signed in

## Setup

```bash
cd dashboard
npm install
cp .env.example .env.local
# Fill in AUTH_GITHUB_ID, AUTH_GITHUB_SECRET, AUTH_SECRET
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

```bash
vercel --cwd dashboard
```

Set the env vars from `.env.example` in your Vercel project settings.

## Stack

- Next.js 15 (App Router) + TypeScript
- Recharts for trend charts
- Lucide React for icons
- next-auth v5 for GitHub OAuth
- No database — all data live from GitHub API
