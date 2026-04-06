# Changelog

All notable changes to DevLens, newest first.
This file covers the root repo (GitHub Action + scripts). For dashboard changes see [devlens-io.vercel.app/changelog](https://devlens-io.vercel.app/changelog).

---

## [0.4.0] - 2026-04-07

### Added
- Expanded scoring from 7 to **9 dimensions**: PR Velocity and Security
- Adjustable weight sliders in the dashboard UI (auto-normalize to 100%)
- Org analysis page: score up to 30 public repos concurrently, ranked by health
- Leaderboard, Checked, Stats, Badge dashboard pages
- Redis-backed watchlist, history snapshots (12 per repo), stats counters
- Live trend chart powered by real Redis history (no longer simulated)
- Full API documented: `/api/analyze`, `/api/compare`, `/api/history`, `/api/watchlist`, `/api/stats`, `/api/badge`
- Repo detail pages at `/repo/owner/name` (permanent shareable URLs)
- Feature badges + CTA buttons (Star on GitHub, Read the Docs) on home page
- All legal/info pages updated: About, FAQ, Privacy, Terms, Cookies
- Docs page fully rewritten with 9-dim scoring table and real API response shapes
- Changelog page updated with New / Improved / Fixed categorized sections

### Fixed
- `page.tsx` was saving `score: undefined` to watchlist (`data.score` → `data.healthScore`)
- `/checked` showed empty entries because `/api/analyze` never wrote to Redis
- Docs page referenced 7 dimensions and simulated history

---

## [0.3.0] - 2026-04-06

### Added
- Shared Nav and Footer components across all pages
- New pages: About, FAQ, Terms, Privacy, Cookies, Sponsor, Docs, Changelog
- `sitemap.ts` and `robots.ts` for SEO indexing
- README badges on home page hero (Live GitHub API · 9 weighted dimensions · Free forever)
- CTA buttons: Star on GitHub, Read the Docs

### Fixed
- NextAuth v5 route handler exports for Next.js 15 compatibility
- Upgraded Next.js to 15.3.6 (patches CVE-2025-66478)

---

## [0.2.0] - 2026-04-06

### Fixed
- Restored original dashboard from commit 643acc5
- Removed stale PostCSS/Tailwind config conflict
- Upgraded Next.js from 15.2.4 to 15.3.1

---

## [0.1.0] - 2026-04-06

### Added
- Initial release: live GitHub API scoring across 7 dimensions (README, Activity, Freshness, Docs, CI/CD, Issues, Community)
- Animated ScoreRing, DimBar progress bars, TrendChart
- Dark/light mode with system preference detection and manual toggle
- Compare two repos side by side at `/compare`
- Copy-paste snippet modal for README integration
- Rate-limit detection with Sign in with GitHub prompt
- GitHub Action composite workflow (no Docker — faster startup)
- Full JSON report as workflow output (`health_score`, `badge_url`, `report_json`)
- Configurable badge style (flat, flat-square, for-the-badge)
