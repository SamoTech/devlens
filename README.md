<div align="center">

![DevLens](docs/assets/banner.svg)

<img src="https://img.shields.io/badge/DevLens-Repo%20Intelligence-brightgreen?style=for-the-badge&logo=github" alt="DevLens"/>
<img src="https://img.shields.io/github/license/SamoTech/devlens?style=for-the-badge" alt="License"/>
<img src="https://img.shields.io/github/stars/SamoTech/devlens?style=for-the-badge" alt="Stars"/>
<img src="https://img.shields.io/badge/Free%20Forever-$0-blue?style=for-the-badge" alt="Free Forever"/>
<img src="https://visitor-badge.laobi.icu/badge?page_id=SamoTech.devlens&left_color=%23555555&right_color=%2301696f&left_text=visitors" alt="Visitors"/>

# 🔭 DevLens

**Repo health scoring in 9 dimensions + real cybersecurity vulnerability scanning. Free forever, live from the GitHub API.**

> **Dogfooding:** DevLens scores `SamoTech/devlens` itself. Every main-branch code change and the weekly schedule refresh the self-health block below, with a **100/100 target** for continuous improvement.

[🌐 Live Dashboard](https://devlens-io.vercel.app) · [🔐 Security Scanner](https://devlens-io.vercel.app/security) · [📖 Docs](https://devlens-io.vercel.app/docs) · [📊 Stats](https://devlens-io.vercel.app/stats) · [💛 Sponsor](https://github.com/sponsors/SamoTech)

</div>

---

<!-- DEVLENS:START -->
![DevLens Health](https://img.shields.io/badge/DevLens%20Health-91%2F100-brightgreen?style=flat-square&logo=github) **Overall health: 91/100** — *Last updated: 2026-09-30*

| Dimension | Progress | Score | Weight |
|---|---|---|---|
| 📝 **README Quality** | `██████████` | ![100](https://img.shields.io/badge/100-brightgreen?style=flat-square) | 20% |
| 🔥 **Commit Activity** | `██████████` | ![100](https://img.shields.io/badge/100-brightgreen?style=flat-square) | 20% |
| 🌿 **Repo Freshness** | `██████████` | ![100](https://img.shields.io/badge/100-brightgreen?style=flat-square) | 15% |
| 📚 **Documentation** | `██████████` | ![96](https://img.shields.io/badge/96-brightgreen?style=flat-square) | 15% |
| ⚙️ **CI/CD Setup** | `██████████` | ![100](https://img.shields.io/badge/100-brightgreen?style=flat-square) | 15% |
| 🎯 **Issue Response** | `█████████░` | ![94](https://img.shields.io/badge/94-brightgreen?style=flat-square) | 10% |
| ⭐ **Community Signal** | `██░░░░░░░░` | ![16](https://img.shields.io/badge/16-red?style=flat-square) | 5% |
| 🔀 **PR Velocity** | `████████░░` | ![85](https://img.shields.io/badge/85-brightgreen?style=flat-square) | 10% |
| 🔐 **Security** | `███████░░░` | ![70](https://img.shields.io/badge/70-green?style=flat-square) | 5% |
<!-- DEVLENS:END -->

---

## ✨ What DevLens Does

Paste a public GitHub repository slug or canonical URL into [devlens-io.vercel.app](https://devlens-io.vercel.app) to get a live health report. Security coverage depends on scanner availability and configured credentials; the dashboard shows failed and unavailable modules explicitly rather than treating them as clean.

| Feature | Details | Free |
|---|---|---|
| 🏥 **9-dimension health score** | Dashboard score model `dashboard-v2-9d`, bounded 0–100, adjustable sliders | ✅ |
| 🔐 **Security Intelligence Engine** | 13 network modules plus locally available CLI integrations; every module reports status | ✅ |
| 📊 **Live GitHub API** | Every score fetched fresh from GitHub, 15-min Redis cache | ✅ |
| 📈 **Trend history** | Weekly snapshots stored in Redis when persistence is configured | ✅ |
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

The security score is `security-v2`. It is an evidence score, not a claim that every scanner completed. The API also returns `scanner_statuses`, `scanner_summary`, and `scoring.confidence`; when any scanner is failed, unavailable, rate limited, timed out, unauthorized, or not configured, the UI displays a degraded-scan warning.

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
Repo Freshness         10%   Days since last push (≤7 days = 100)
Documentation          10%   LICENSE, CONTRIBUTING, CHANGELOG, SECURITY, docs/
CI/CD Setup            10%   GitHub Actions workflow count
Issue Response         10%   Closed-to-total issue ratio
Community Signal        5%   Logarithmic score from stars + forks
PR Velocity            10%   Average PR merge time (last 20 merged PRs)
Security                5%   Advisory/security evidence summary
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
[![DevLens Health](https://devlens-io.vercel.app/api/badge/owner/name)](https://devlens-io.vercel.app/?repo=owner/name)
```

### Option B — Auto-updating via GitHub Actions

1. Add markers to your `README.md`:

```markdown
<!-- DEVLENS:START -->
