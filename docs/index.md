# DevLens Documentation

Welcome to the DevLens documentation. DevLens is a GitHub Action that gives your repository a health score across 7 dimensions and auto-updates your README with a live badge.

## Contents

- [Quick Start](../README.md#-quick-start)
- [Health Score Dimensions](#health-score-dimensions)
- [Configuration Reference](#configuration-reference)
- [Inputs & Outputs](#inputs--outputs)
- [Discord Integration](#discord-integration)
- [AI Insights with Groq](#ai-insights-with-groq)
- [FAQ](#faq)

---

## Health Score Dimensions

DevLens evaluates your repo across 7 weighted dimensions:

| Dimension | Weight | What it measures |
|---|---|---|
| README Quality | 20% | Length, sections, badges, code blocks, keywords |
| Commit Activity | 20% | Push frequency over last 90 days |
| Repo Freshness | 15% | Days since last push |
| Documentation | 15% | LICENSE, CONTRIBUTING, CHANGELOG, CODE_OF_CONDUCT, SECURITY, docs/ |
| CI/CD Setup | 15% | GitHub Actions workflows present |
| Issue Response | 10% | Closed vs open issue ratio |
| Community Signal | 5% | Stars, forks, watchers |

---

## Configuration Reference

### Minimal setup

```yaml
- uses: SamoTech/devlens@v1
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

### Full setup

```yaml
- uses: SamoTech/devlens@v1
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    groq_api_key: ${{ secrets.GROQ_API_KEY }}
    groq_model: 'llama-3.1-8b-instant'
    badge_style: 'flat-square'
    update_readme: 'true'
    notify_discord: ${{ secrets.DISCORD_WEBHOOK }}
```

---

## Inputs & Outputs

### Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `github_token` | ✅ | — | `${{ secrets.GITHUB_TOKEN }}` |
| `groq_api_key` | ❌ | `""` | Free Groq key for AI insights |
| `groq_model` | ❌ | `llama-3.1-8b-instant` | Override Groq model |
| `badge_style` | ❌ | `flat` | `flat`, `flat-square`, `for-the-badge` |
| `update_readme` | ❌ | `true` | Auto-inject health badge |
| `notify_discord` | ❌ | `""` | Discord webhook URL |

### Outputs

| Output | Description |
|---|---|
| `health_score` | Integer 0–100 |
| `badge_url` | Ready-to-embed shields.io URL |
| `report_json` | Full JSON of all dimension scores |

---

## Discord Integration

Set `DISCORD_WEBHOOK` as a repository secret, then pass it to the action:

```yaml
notify_discord: ${{ secrets.DISCORD_WEBHOOK }}
```

The weekly digest includes all 7 dimension scores as a rich embed sent every Monday at 8am UTC.

---

## AI Insights with Groq

DevLens uses [Groq](https://console.groq.com) (free tier) to generate a 3-line AI-written health summary that gets injected into your README between the `<!-- DEVLENS:START -->` and `<!-- DEVLENS:END -->` markers.

Get your free API key at [console.groq.com/keys](https://console.groq.com/keys).

---

## FAQ

**Q: Does DevLens store any of my repo data?**  
A: No. DevLens runs entirely inside GitHub Actions. No data leaves your repo.

**Q: Can I use DevLens on private repos?**  
A: Yes. The `GITHUB_TOKEN` works for both public and private repos.

**Q: What Groq models are supported?**  
A: Any model available in your Groq project. Default is `llama-3.1-8b-instant`. Fast and free.

**Q: How do I get 100/100?**  
A: Add `LICENSE`, `CONTRIBUTING.md`, `CHANGELOG.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, a `docs/` folder, maintain active commits, add CI workflows, and keep issues closed.
