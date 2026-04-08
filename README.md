<div align="center">

<img src="https://img.shields.io/badge/DevLens-Repo%20Intelligence-brightgreen?style=for-the-badge&logo=github" alt="DevLens"/>
<img src="https://img.shields.io/github/license/SamoTech/devlens?style=for-the-badge" alt="License"/>
<img src="https://img.shields.io/github/stars/SamoTech/devlens?style=for-the-badge" alt="Stars"/>
<img src="https://img.shields.io/badge/Free%20Forever-$0-blue?style=for-the-badge" alt="Free Forever"/>
<img src="https://visitor-badge.laobi.icu/badge?page_id=SamoTech.devlens&left_color=%23555555&right_color=%2301696f&left_text=visitors" alt="Visitors"/>

# 🔭 DevLens

**Repo health scoring in 9 dimensions + real cybersecurity vulnerability scanning. Free forever, live from the GitHub API.**

[🌐 Live Dashboard](https://devlens-io.vercel.app) · [🔐 Security Scanner](https://devlens-io.vercel.app/security) · [📖 Docs](https://devlens-io.vercel.app/docs) · [📊 Stats](https://devlens-io.vercel.app/stats) · [💛 Sponsor](https://github.com/sponsors/SamoTech)

</div>

---

<!-- DEVLENS:START -->
![DevLens Health](https://img.shields.io/badge/DevLens%20Health-97%2F100-brightgreen?style=flat-square&logo=github) **Overall health: 97/100** — *Last updated: 2026-04-08*

| Dimension | Score | Weight |
|---|---|---|
| 📝 README Quality | ![100](https://img.shields.io/badge/100-brightgreen?style=flat-square) | 20% |
| ⚡ Commit Activity | ![100](https://img.shields.io/badge/100-brightgreen?style=flat-square) | 20% |
| 🌿 Repo Freshness | ![100](https://img.shields.io/badge/100-brightgreen?style=flat-square) | 15% |
| 📚 Documentation | ![96](https://img.shields.io/badge/96-brightgreen?style=flat-square) | 15% |
| ⚙️ CI/CD Setup | ![100](https://img.shields.io/badge/100-brightgreen?style=flat-square) | 10% |
| 🎯 Issue Response | ![100](https://img.shields.io/badge/100-brightgreen?style=flat-square) | 10% |
| ⭐ Community Signal | ![0](https://img.shields.io/badge/0-red?style=flat-square) | 5% |
| 🔀 PR Velocity | ![100](https://img.shields.io/badge/100-brightgreen?style=flat-square) | 3% |
| 🔒 Security | ![82](https://img.shields.io/badge/82-brightgreen?style=flat-square) | 2% |
<!-- DEVLENS:END -->

---

## ✨ What DevLens Does

Paste any public GitHub repo URL into [devlens-io.vercel.app](https://devlens-io.vercel.app) and get a live health report + deep security scan — no signup, no API key needed.

| Feature | Details | Free |
|---|---|---|
| 🏥 **9-dimension health score** | Weighted 0–100 score, adjustable sliders | ✅ |
| 🔐 **Security Intelligence Engine** | 13 real scan modules — CVEs, secrets, SAST, NVD, advisories | ✅ |
| 📊 **Live GitHub API** | Every score fetched fresh from GitHub, 15-min Redis cache | ✅ |
| 📈 **Trend history** | Real weekly snapshots stored in Redis, shown as a trend chart | ✅ |
| 🏢 **Org analysis** | Score all public repos in any GitHub org, ranked by health | ✅ |
| ⚖️ **Side-by-side compare** | Analyze two repos at once at `/compare` | ✅ |
| 🏆 **Leaderboard** | Top-scoring repos from all DevLens users at `/leaderboard` | ✅ |
| ✅ **Checked repos** | Searchable list of recently analyzed repos at `/checked` | ✅ |
| 📡 **Stats** | Live usage counters: analyses, visitors, top repos at `/stats` | ✅ |
| 🎖️ **README badge** | Live shields.io badge for your README at `/badge` | ✅ |
| 🌗 **Dark / light mode** | System preference + manual toggle | ✅ |

---

## 🔐 Security Intelligence Engine — 13 Free Scan Modules

DevLens v1.1.0 ships a full vulnerability scanner at [/security](https://devlens-io.vercel.app/security). Every module uses a **100% free API** — no paid plans, no credit card.

```
Module                    Source                         Auth Needed
──────────────────────────────────────────────────────────────────────────
1. Dependabot CVEs        github.com API                 GITHUB_TOKEN
2. Secret Scanning        github.com API                 GITHUB_TOKEN
3. Code Scanning (SAST)   github.com API (CodeQL)        GITHUB_TOKEN
4. OSV.dev                api.osv.dev                    None (free)
5. NIST NVD               services.nvd.nist.gov          Optional key (free)
6. GitHub Advisory DB     api.github.com GraphQL         GITHUB_TOKEN
7. PyPI Safety DB         osv.dev × requirements.txt     None (free)
8. Retire.js CDN Check    osv.dev × HTML script src      None (free)
9. License Risk           github.com API                 GITHUB_TOKEN
10. CI Check Runs         github.com API                 GITHUB_TOKEN
11. SonarCloud            sonarcloud.io API              None (public repos)
12. DeepSource            api.deepsource.io GraphQL      None (public repos)
13. Codecov               codecov.io API                 None (public repos)
```

### Security Score Formula (0–100)

| Module | Max Deduction |
|---|---|
| Dependabot (critical/high/medium CVEs) | −30 pts |
| Secret scanning open alerts | −25 pts |
| Code scanning SAST findings | −24 pts |
| OSV.dev dependency vulns | −28 pts |
| NIST NVD CVEs | −27 pts |
| GitHub Advisory DB hits | −21 pts |
| PyPI Safety DB vulns | −27 pts |
| Retire.js vulnerable CDN libs | −20 pts |
| Missing SECURITY.md | −3 pts |
| Copyleft / missing license | −5 pts |

### Security API

```bash
# Full security scan (cached 15 min)
GET https://devlens-io.vercel.app/api/security?repo=owner/name

# Force fresh scan (bypass cache)
GET https://devlens-io.vercel.app/api/security?repo=owner/name&force=1
```

---

## 📊 The 9 Health Dimensions

```
Dimension         Default Weight   What it measures
────────────────────────────────────────────────────────────────────
README Quality         20%   Length, keywords, code blocks, images, headings
Commit Activity        20%   Commits to default branch in last 90 days
Repo Freshness         15%   Days since last push (≤7 days = 100)
Documentation          15%   LICENSE, CONTRIBUTING, CHANGELOG, SECURITY, docs/
CI/CD Setup            10%   GitHub Actions workflow count
Issue Response         10%   Closed-to-total issue ratio
Community Signal        5%   Logarithmic score from stars + forks
PR Velocity             3%   Average PR merge time (last 20 merged PRs)
Security                2%   Now powered by the full 13-module scanner
```

Weights are **fully adjustable** in the UI via sliders — they auto-normalize to 100%.

---

## 🌐 Dashboard Pages

| Page | URL | Description |
|---|---|---|
| Analyze | `/` | Analyze any public repo, adjust weights |
| Security | `/security` | 13-module vulnerability & code quality scanner |
| Org | `/org` | Score all repos in a GitHub org |
| Compare | `/compare` | Side-by-side two-repo comparison |
| Leaderboard | `/leaderboard` | Top-scoring repos from all users |
| Checked | `/checked` | Full searchable recently-analyzed list |
| Badge | `/badge` | Generate a live README badge |
| Stats | `/stats` | Live usage stats (analyses, visitors, top repos) |
| Docs | `/docs` | Full API reference + scoring algorithm + self-hosting |
| Changelog | `/changelog` | Release history |
| Sponsor | `/sponsor` | Support the project |

---

## 🚀 Quick Start — Add Badge to Your README

### Option A — Static badge

```markdown
[![DevLens Health](https://devlens-io.vercel.app/api/badge?repo=owner/name)](https://devlens-io.vercel.app/?repo=owner/name)
```

### Option B — Auto-updating via GitHub Actions

1. Add markers to your `README.md`:

```markdown
<!-- DEVLENS:START -->
<!-- DEVLENS:END -->
```

2. Create `.github/workflows/devlens.yml`:

```yaml
name: DevLens Health Check
on:
  push:
    branches: [main]
  schedule:
    - cron: '0 9 * * 1'   # every Monday 09:00 UTC
permissions:
  contents: write
jobs:
  devlens:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Fetch DevLens score
        run: |
          curl -s "https://devlens-io.vercel.app/api/analyze?repo=${{ github.repository }}" \
            | jq '.healthScore'
```

> `GITHUB_TOKEN` is automatic — no setup needed.

---

## 🔌 API Reference

```bash
# Analyze a repo
GET https://devlens-io.vercel.app/api/analyze?repo=owner/name

# Full security + vulnerability scan
GET https://devlens-io.vercel.app/api/security?repo=owner/name
GET https://devlens-io.vercel.app/api/security?repo=owner/name&force=1  # bypass cache

# Compare two repos
GET https://devlens-io.vercel.app/api/compare?a=owner/a&b=owner/b

# Score history (last 12 weekly snapshots)
GET https://devlens-io.vercel.app/api/history?repo=owner/name

# Recently checked repos
GET https://devlens-io.vercel.app/api/watchlist

# Badge data
GET https://devlens-io.vercel.app/api/badge?repo=owner/name

# Live usage stats
GET https://devlens-io.vercel.app/api/stats
```

---

## 🛠️ Self-Hosting

```bash
git clone https://github.com/SamoTech/devlens
cd devlens/dashboard
npm install
cp .env.example .env.local   # fill in env vars
npm run dev                   # → http://localhost:3000
```

**Environment variables:**

```env
# GitHub OAuth (Sign in with GitHub)
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
AUTH_SECRET=

# Upstash Redis (watchlist, history, stats, cache)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Server-side GitHub token (60 → 5000 req/hr)
# Powers 9 of the 13 security scan modules
GITHUB_TOKEN=

# NIST NVD API key — free, raises rate limit 10×
# Register at: https://nvd.nist.gov/developers/request-an-api-key
NVD_API_KEY=        # optional but recommended
```

**Deploy to Vercel:**
```bash
vercel --cwd dashboard
# Set Root Directory = dashboard in Vercel project settings
```

---

## 🗺️ Roadmap

- [x] 9-dimension health score engine
- [x] Adjustable weight sliders with auto-normalization
- [x] Redis-backed watchlist, history snapshots, stats counters
- [x] Live trend chart from real historical data
- [x] Org analysis (up to 30 repos ranked by health)
- [x] Leaderboard, Checked, Stats, Badge pages
- [x] Full API with response shapes documented
- [x] GitHub Actions integration
- [x] Dark / light mode
- [x] SEO: sitemap, robots.txt, Open Graph
- [x] **Security Intelligence Engine — 13 free scan modules** ✨ *new in v1.1.0*
- [x] **NIST NVD integration** ✨ *new in v1.1.0*
- [x] **GitHub Advisory Database GraphQL** ✨ *new in v1.1.0*
- [x] **PyPI Safety DB scanning** ✨ *new in v1.1.0*
- [x] **Retire.js CDN vulnerability heuristic** ✨ *new in v1.1.0*
- [ ] GitHub Advisory cross-reference with actual installed versions
- [ ] Email digest (Resend free tier)
- [ ] Slack / Discord notifications
- [ ] Private repo support (GitHub OAuth)
- [ ] Multi-repo portfolio dashboard
- [ ] GitHub Marketplace Action listing

---

## 💛 Sponsor

DevLens is — and always will be — **completely free**. No trials. No paywalls.

If DevLens saves you time, [a small sponsorship](https://github.com/sponsors/SamoTech) keeps this project alive and funds new features.

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). PRs welcome!

---

## 📄 License

MIT © [SamoTech](https://github.com/SamoTech)

---

<div align="center">
  <sub>Built with Next.js · Upstash Redis · GitHub API · NIST NVD · OSV.dev · ☕ by SamoTech<br/>
  Free forever. If it helped you, <a href="https://github.com/sponsors/SamoTech">a small sponsorship</a> keeps the lights on. 💛</sub>
</div>
