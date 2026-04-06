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

[Install in 30s](#-quick-start) · [GitHub Marketplace](https://github.com/marketplace/actions/devlens-repo-health) · [💛 Sponsor](https://github.com/sponsors/SamoTech)

</div>

<!-- DEVLENS:START -->
![DevLens Health](https://img.shields.io/badge/DevLens%20Health-92%2F100-brightgreen?style=flat-square&logo=github) **Overall health: 92/100** — *Last updated: 2026-04-06*

| Dimension | Progress | Score | Weight |
|---|---|---|---|
| 📝 **README Quality** | `█████████░` | ![88](https://img.shields.io/badge/88-brightgreen?style=flat-square) | 20% |
| 🔥 **Commit Activity** | `██████████` | ![100](https://img.shields.io/badge/100-brightgreen?style=flat-square) | 20% |
| 🌿 **Repo Freshness** | `██████████` | ![100](https://img.shields.io/badge/100-brightgreen?style=flat-square) | 15% |
| 📚 **Documentation** | `██████████` | ![96](https://img.shields.io/badge/96-brightgreen?style=flat-square) | 15% |
| ⚙️ **CI/CD Setup** | `██████████` | ![100](https://img.shields.io/badge/100-brightgreen?style=flat-square) | 15% |
| 🎯 **Issue Response** | `██████████` | ![100](https://img.shields.io/badge/100-brightgreen?style=flat-square) | 10% |
| ⭐ **Community Signal** | `░░░░░░░░░░` | ![0](https://img.shields.io/badge/0-red?style=flat-square) | 5% |

The low community score of 0 suggests that the project may lack user engagement and may require an effort to attract and retain contributors.
<!-- DEVLENS:END -->

---

## ✨ What DevLens Does

| Feature | Description | Free |
|---|---|---|
| 🏥 **Health Score** | 0–100 score across 7 dimensions | ✅ |
| 📝 **AI README Update** | Injects live health badge on every push | ✅ |
| 📊 **Analytics Badge** | shields.io badge auto-generated | ✅ |
| 📬 **Weekly Digest** | Discord report every Monday 8am UTC | ✅ |
| 🤖 **AI Insights** | Groq-powered suggestions (free key) | ✅ |
| ♾️ **Unlimited Repos** | No seat limits, no per-repo pricing | ✅ |

> **vs. Code Climate ($37/dev) · LinearB ($49/dev) · GitClear ($15/dev)**  
> DevLens is 100% free, runs inside GitHub Actions, zero vendor lock-in.

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

Paste this anywhere in your `README.md` where you want the live health badge to appear:

```markdown
<!-- DEVLENS:START -->
