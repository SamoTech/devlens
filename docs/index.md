# DevLens Documentation

DevLens is a GitHub Action that scores the repository where it runs across 9 transparent dimensions and can write the result into that repository's README.

There is no hosted dashboard, database, or required DevLens account.

## Quick Start

Create `.github/workflows/devlens.yml`:

```yaml
name: DevLens

on:
  push:
    branches: [main, master]
  workflow_dispatch:

permissions:
  contents: write
  security-events: read

jobs:
  health:
    runs-on: ubuntu-latest
    steps:
      - uses: SamoTech/devlens@v2
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          update_readme: 'true'
          badge_style: flat-square
```

The Action automatically identifies the current repository from `github.repository`.

## Health Score Dimensions

| Dimension | Weight | What it measures |
|---|---:|---|
| README Quality | 20% | README completeness and useful project information |
| Commit Activity | 20% | Recent commit activity |
| Repo Freshness | 10% | Time since the latest repository activity |
| Documentation | 10% | Standard project documentation files and docs directory |
| CI/CD Setup | 10% | GitHub Actions workflow coverage |
| Issue Response | 10% | Issue maintenance and closure signals |
| Community Signal | 5% | Public stars and forks |
| PR Velocity | 10% | Pull-request maintenance and merge-time signals |
| Security | 5% | Repository security evidence and advisory signals |

The weighted result is bounded to 0–100. External signals such as stars and forks are measured as they exist; DevLens does not manufacture a score.

## README Integration

DevLens maintains:

```markdown
<!-- DEVLENS:START -->
...generated score report...
<!-- DEVLENS:END -->
```

The Action replaces only the content between those markers.

If the markers are absent, DevLens appends them to the README.

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `github_token` | Yes | — | GitHub token used for repository inspection |
| `badge_style` | No | `flat` | Shields.io badge style |
| `update_readme` | No | `true` | Write the score report to README |
| `readme_branch` | No | empty | Branch to update; empty uses the repository default branch |
| `fail_on_score_below` | No | empty | Fail the Action below this 0–100 score |
| `notify_discord` | No | empty | Optional Discord webhook |

## Outputs

| Output | Description |
|---|---|
| `health_score` | Integer from 0 to 100 |
| `badge_url` | Shields.io badge URL |
| `report_json` | Complete machine-readable report |

## CI Quality Gate

```yaml
- uses: SamoTech/devlens@v2
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    update_readme: 'true'
    fail_on_score_below: '80'
```

## Data and Privacy

DevLens runs inside the user's GitHub Actions environment. The scoring implementation calls GitHub's API directly using the supplied Action token. The Action uses `GITHUB_API_URL`, so GitHub Enterprise deployments do not require a hard-coded `api.github.com` endpoint.

No DevLens-hosted database is required for repository scoring. No Groq or AI provider is required for scoring.

## Testing

The repository contains a live integration workflow that executes the actual composite Action against GitHub's API and validates the resulting outputs and all 9 dimensions.

This is the same execution path used when a user installs the Action in another repository.
