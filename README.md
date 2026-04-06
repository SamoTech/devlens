<div align="center">

<img src="https://img.shields.io/badge/DevLens-Repo%20Intelligence-brightgreen?style=for-the-badge&logo=github" alt="DevLens"/>
<img src="https://img.shields.io/github/license/SamoTech/devlens?style=for-the-badge" alt="License"/>
<img src="https://img.shields.io/github/stars/SamoTech/devlens?style=for-the-badge" alt="Stars"/>
<img src="https://img.shields.io/badge/Free%20Forever-$0-blue?style=for-the-badge" alt="Free Forever"/>
<a href="https://github.com/marketplace/actions/devlens-repo-health"><img src="https://img.shields.io/badge/GitHub%20Marketplace-DevLens%20Repo%20Health-orange?style=for-the-badge&logo=github" alt="GitHub Marketplace"/></a>
<img src="https://visitor-badge.laobi.icu/badge?page_id=SamoTech.devlens&left_color=%23555555&right_color=%2301696f&left_text=visitors" alt="Visitors"/>

# 🔭 DevLens Repo Health

<img src="./devlens-cover.png" alt="DevLens Cover" width="100%"/>

**The GitHub Action that gives your repo a health score, auto-updates your README,
and sends a weekly dev analytics digest — 100% free, forever.**

[Install in 30s](#-quick-start) · [🌐 Live Dashboard](https://devlens-io.vercel.app) · [GitHub Marketplace](https://github.com/marketplace/actions/devlens-repo-health) · [💛 Sponsor](https://github.com/sponsors/SamoTech)

</div>

<!-- DEVLENS:START -->
![DevLens Health](https://img.shields.io/badge/DevLens%20Health-97%2F100-brightgreen?style=flat-square&logo=github) **Overall health: 97/100** — *Last updated: 2026-04-06*

| Dimension | Progress | Score | Weight |
|---|---|---|---|
| 📝 **README Quality** | `██████████` | ![100](https://img.shields.io/badge/100-brightgreen?style=flat-square) | 20% |
| 🔥 **Commit Activity** | `██████████` | ![100](https://img.shields.io/badge/100-brightgreen?style=flat-square) | 20% |
| 🌿 **Repo Freshness** | `██████████` | ![100](https://img.shields.io/badge/100-brightgreen?style=flat-square) | 15% |
| 📚 **Documentation** | `██████████` | ![96](https://img.shields.io/badge/96-brightgreen?style=flat-square) | 15% |
| ⚙️ **CI/CD Setup** | `██████████` | ![100](https://img.shields.io/badge/100-brightgreen?style=flat-square) | 15% |
| 🎯 **Issue Response** | `██████████` | ![100](https://img.shields.io/badge/100-brightgreen?style=flat-square) | 10% |
| ⭐ **Community Signal** | `░░░░░░░░░░` | ![0](https://img.shields.io/badge/0-red?style=flat-square) | 5% |
<!-- DEVLENS:END -->

---

## ✨ What DevLens Does

| Feature | Description | Free |
|---|---|---|
| 🏥 **Health Score** | 0–100 score across 7 dimensions | ✅ |
| 📝 **AI README Update** | Injects live 7-row health table on every push | ✅ |
| 📊 **Analytics Badge** | shields.io badge auto-generated | ✅ |
| 📬 **Weekly Digest** | Discord report every Monday 8am UTC | ✅ |
| 🤖 **AI Insights** | Groq-powered 1-line suggestion (free key) | ✅ |
| 🌐 **Web Dashboard** | Live score for any public repo | ✅ |
| ♾️ **Unlimited Repos** | No seat limits, no per-repo pricing | ✅ |

> **vs. Code Climate ($37/dev) · LinearB ($49/dev) · GitClear ($15/dev)**
> DevLens is 100% free, runs inside GitHub Actions, zero vendor lock-in.

---

## 🌐 Web Dashboard

**[→ devlens-io.vercel.app](https://devlens-io.vercel.app)**

Paste any public GitHub repo URL and get a live health report — no signup, no API key needed.

| Feature | Details |
|---|---|
| Live score | Reads directly from GitHub API on every load |
| 7-row health table | Progress bars for each dimension |
| Historical trend chart | 8-week score trend |
| Side-by-side compare | `/compare` — analyze two repos at once |
| "Add to your repo" | Copy-paste README marker + workflow in one click |
| Dark / light mode | System preference + manual toggle |

```bash
# Run the dashboard locally
cd dashboard
npm install && npm run dev
# → http://localhost:3000
```

See [`dashboard/README.md`](dashboard/README.md) for full setup and deployment instructions.

---

## 📊 Health Score Dimensions

```
README Quality    ██████████  20%  — length, sections, badges, code blocks
Commit Activity   ██████████  20%  — push frequency last 90 days
Repo Freshness    ██████████  15%  — days since last push
Documentation     ██████████  15%  — LICENSE, CONTRIBUTING, CHANGELOG, etc.
CI/CD Setup       ██████████  15%  — GitHub Actions workflows present
Issue Response    ██████████  10%  — closed vs open issue ratio
Community Signal  ░░░░░░░░░░   5%  — stars, forks, watchers
```

---

## ⚡ Quick Start

### Step 1 — Add markers to your README

Paste these two comment lines anywhere in your `README.md`:

```markdown
<!-- DEVLENS:START -->
<!-- DEVLENS:END -->
```

On the next push, DevLens will **automatically inject a full 7-row health table** between them.

> ⚠️ **Do NOT add anything between the markers.** DevLens replaces everything between them on every run.

---

### Step 2 — Add the workflow

Create `.github/workflows/devlens.yml`:

```yaml
name: DevLens Health Check
on:
  push:
    branches: [main]
  schedule:
    - cron: '0 8 * * 1'
permissions:
  contents: write
jobs:
  devlens:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: SamoTech/devlens@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          groq_api_key: ${{ secrets.GROQ_API_KEY }}
          notify_discord: ${{ secrets.DISCORD_WEBHOOK }}
```

---

### Step 3 — Add secrets (optional)

| Secret | Where to get it | Why |
|---|---|---|
| `GROQ_API_KEY` | [console.groq.com/keys](https://console.groq.com/keys) | AI insight line below the table |
| `DISCORD_WEBHOOK` | Discord → Channel Settings → Integrations | Weekly digest |

> ✅ `GITHUB_TOKEN` is automatic — no setup needed.

---

## 🔧 Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `github_token` | ✅ | — | `${{ secrets.GITHUB_TOKEN }}` |
| `groq_api_key` | ❌ | `""` | Free Groq key for AI insights |
| `groq_model` | ❌ | `llama-3.1-8b-instant` | Groq model ID |
| `badge_style` | ❌ | `flat` | `flat`, `flat-square`, `for-the-badge` |
| `update_readme` | ❌ | `true` | Auto-inject health table into README |
| `notify_discord` | ❌ | `""` | Discord webhook URL |

## 📤 Outputs

| Output | Description |
|---|---|
| `health_score` | Integer 0–100 |
| `badge_url` | Ready-to-embed shields.io URL |
| `report_json` | Full JSON of all 7 dimension scores |

---

## 🛣️ Roadmap

- [x] 7-dimension health score engine
- [x] Auto README table injection (all 7 rows)
- [x] Weekly Discord digest
- [x] AI README insights (Groq/Llama 3)
- [x] Web dashboard (Next.js) — **live at [devlens-io.vercel.app](https://devlens-io.vercel.app)**
- [ ] Email digest (Resend free tier)
- [ ] PR quality scoring
- [ ] Historical trend charts (persisted)
- [ ] Multi-repo portfolio view
- [ ] Slack integration

---

## 💛 Sponsor DevLens

DevLens is — and always will be — **completely free**. No trials. No paywalls. No "Pro" tier.

If DevLens saves you time or makes your repos look sharp — a sponsorship keeps this project alive.

**[→ Sponsor on GitHub](https://github.com/sponsors/SamoTech)**

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). PRs welcome!

---

## 📄 License

MIT © [SamoTech](https://github.com/SamoTech)

---

<div align="center">
  <sub>Built with GitHub Actions + Groq + ☕ by SamoTech<br/>
  Free forever. If it helped you, <a href="https://github.com/sponsors/SamoTech">a small sponsorship</a> keeps the lights on. 💛</sub>
</div>
