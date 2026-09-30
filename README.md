<div align="center">

![DevLens](docs/banner.svg)

<img src="https://img.shields.io/badge/DevLens-GitHub%20Action-brightgreen?style=for-the-badge&logo=github" alt="DevLens GitHub Action"/>
<img src="https://img.shields.io/github/license/SamoTech/devlens?style=for-the-badge" alt="License"/>
<img src="https://img.shields.io/github/stars/SamoTech/devlens?style=for-the-badge" alt="Stars"/>

# 🔭 DevLens

**A GitHub Action that scores the repository where it runs across 9 transparent health dimensions.**

No dashboard. No hosted database. No account required. The repository being scored is the user's own GitHub repository, identified automatically by `github.repository`.

[GitHub Marketplace](https://github.com/marketplace/actions/devlens-repo-health) · [Latest v2.1.0 release](https://github.com/SamoTech/devlens/releases/tag/v2.1.0)

</div>

---

## What DevLens does

Add one GitHub Actions workflow to your repository.

DevLens then:

1. Reads the repository directly through the GitHub API.
2. Calculates a transparent 0–100 score across 9 dimensions.
3. Publishes the score in the GitHub Actions job summary.
4. Exposes `health_score`, `badge_url`, and the complete `report_json` as Action outputs.
5. Optionally writes the current score and dimension table between `DEVLENS:START` / `DEVLENS:END` markers in your README.
6. Can fail CI when the repository falls below a threshold you choose.

The Action scores **the repository where it is installed**. There is no separate DevLens web application involved.

## 9 dimensions

| Dimension | Weight |
|---|---:|
| 📝 README Quality | 20% |
| 🔥 Commit Activity | 20% |
| 🌿 Repo Freshness | 10% |
| 📚 Documentation | 10% |
| ⚙️ CI/CD Setup | 10% |
| 🎯 Issue Response | 10% |
| ⭐ Community Signal | 5% |
| 🔀 PR Velocity | 10% |
| 🔐 Security | 5% |

The weighted result is bounded to 0–100. DevLens does not artificially force a repository to 100.

## Install in 60 seconds

Create `.github/workflows/devlens.yml` in the repository you want to score:

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
      - name: Score repository
        uses: SamoTech/devlens@v2
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          update_readme: 'true'
          readme_branch: ''
          badge_style: flat-square
```

Commit the workflow, open the **Actions** tab, and run **DevLens**. The Action automatically scores the repository where the workflow runs; you do not register the repository anywhere.

For the default installation, `contents: write` is required because README persistence is enabled by default. `security-events: read` enables security-related API checks; DevLens remains conservative when those APIs are unavailable.

### Choose the installation that matches your repository

**Recommended — README report enabled**

Use this when you want DevLens to maintain the health report in the repository README. This is the standard installation shown above.

- `contents: write` is required for the README update.
- `security-events: read` enables the security-related checks.
- No repository registration or DevLens account is required.

**Read-only — no repository writes**

Use this when repository policy does not allow the workflow to write files. Set `update_readme: 'false'` and use `contents: read`. DevLens still publishes the score and report through the Actions run.

**CI gate — enforce a minimum score**

Use this when DevLens is part of a quality gate. Add `fail_on_score_below` to the normal installation:

```yaml
with:
  github_token: ${{ secrets.GITHUB_TOKEN }}
  update_readme: 'true'
  fail_on_score_below: '80'
```

The threshold only controls whether the Action fails; it does not change the calculated score.

### First-run checklist

1. Save the workflow under `.github/workflows/` in the repository you want to score.
2. Commit the workflow and confirm GitHub recognizes it in the **Actions** tab.
3. Check the workflow `permissions` block. Use `contents: write` only when README persistence is enabled.
4. Confirm `github_token` is mapped to `${{ secrets.GITHUB_TOKEN }}`.
5. Run the workflow manually with `workflow_dispatch` when you want to test the installation without waiting for a push.
6. Open the completed run and inspect the DevLens job summary and `health_score` output.
7. If README persistence is enabled, confirm the `DEVLENS:START` / `DEVLENS:END` block was updated on the intended branch.

### Common first-run failures

**The workflow is not appearing in Actions:** Confirm the file path is under `.github/workflows/`, the YAML is valid, and the workflow has been committed to GitHub.

**The Action fails with a permissions error:** Compare the workflow `permissions` block with the installation mode. README persistence needs `contents: write`; read-only scoring can use `contents: read` with `update_readme: 'false'`.

**The score runs but README does not change:** Confirm `update_readme: 'true'`, verify the token can write repository contents, and check `readme_branch` if you intentionally target a branch other than the repository default.

**You want to test README writes safely:** Create a disposable branch and set `readme_branch` to that branch. This lets you validate persistence without intentionally changing the production/default branch.


## Common repository patterns

DevLens does not have separate scoring modes for different repository types. The same Action scores the repository where it runs; these examples show practical workflow choices for common setups.

### Application or service repository

Run on changes to the default branch and allow README persistence:

```yaml
on:
  push:
    branches: [main]
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
```

Use this when the repository's health report should stay visible in the README after normal development activity.

### Open-source library or package

Run after changes and keep a manual trigger for maintainers:

```yaml
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
          fail_on_score_below: '70'
```

Use the threshold only when maintainers want repository health to act as a CI quality signal. The threshold does not modify the score.

### Monorepo or high-change repository

Run the same repository-wide score on the default branch and use manual runs when needed:

```yaml
on:
  push:
    branches: [main]
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
          readme_branch: ''
```

DevLens evaluates the GitHub repository as a whole. It does not score individual packages or subdirectories separately.

### Restricted or read-only repository

If repository policy prohibits workflow writes, use the least-privilege read-only configuration:

```yaml
permissions:
  contents: read
  security-events: read

jobs:
  health:
    runs-on: ubuntu-latest
    steps:
      - uses: SamoTech/devlens@v2
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          update_readme: 'false'
```

This keeps the score and Actions summary while avoiding README writes.

## README result

DevLens maintains this block automatically:

```markdown
<!-- DEVLENS:START -->
...current score and dimension report...
<!-- DEVLENS:END -->
```

Only the content between the markers is replaced. If the markers do not exist, DevLens appends them.

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `github_token` | Yes | — | GitHub token used for repository inspection |
| `update_readme` | No | `true` | Write the score report to README |
| `readme_branch` | No | empty | Branch to update; empty uses the repository default branch |
| `badge_style` | No | `flat` | Shields.io badge style |
| `fail_on_score_below` | No | empty | Fail the Action below this 0–100 score |
| `notify_discord` | No | empty | Optional Discord webhook |

## Outputs

| Output | Description |
|---|---|
| `health_score` | Overall score from 0 to 100 |
| `badge_url` | Shields.io badge URL for the current score |
| `report_json` | Machine-readable report containing all nine dimensions |

## Common installation problems

**Permissions error:** The default installation writes `README.md`, so the workflow needs `contents: write`. For a read-only run, set `update_readme: 'false'` and use `contents: read`.

**README was not updated:** Confirm `update_readme: 'true'` and `contents: write`. If `readme_branch` is set, that branch must be writable by the supplied token.

**Security score is conservative:** GitHub security APIs can be unavailable or permission-restricted. DevLens deliberately does not convert unavailable security evidence into a high score.

**Testing without changing the default branch:** Set `readme_branch` to a disposable branch. README persistence is designed to be testable without mutating the production branch.

## CI quality gate

```yaml
- uses: SamoTech/devlens@v2
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    update_readme: 'true'
    fail_on_score_below: '80'
```

## Versioning

Production workflows should use `@v2`, not `@main`. Pin to a specific release tag or full commit SHA when you require immutable supply-chain control.

The current latest verified v2 release is `v2.0.8`. The release preflight verified the Action version and the nine-dimension report before publication. The floating `v2` tag tracks the latest verified v2 release.

## Runtime dependencies

The Action installs its direct Python dependencies from the repository's pinned `requirements.txt` rather than resolving unpinned packages at runtime.

## Testing

DevLens has two validation layers:

- Static validation compiles the scorer and validates the Action metadata.
- Live integration executes the actual composite Action against GitHub's API and validates its outputs and all nine dimensions.

README persistence is also testable without mutating the production branch by setting `readme_branch` to a disposable test branch.

Release automation runs a live Action preflight before creating the versioned tag and refuses to overwrite an existing versioned release tag.

## Marketplace

DevLens is a single public GitHub Action repository with `action.yml` at the root.

The v2 distribution target is:

- Latest verified release: `v2.0.8`
- Consumer tag: `v2`
- Version-reporting correction: released and verified in `v2.0.8`
- Marketplace action: **DevLens Repo Health**
- Distribution: GitHub Marketplace
- PyPI: not a distribution target

For production workflows:

```yaml
- uses: SamoTech/devlens@v2
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

Marketplace publication status must be verified separately from GitHub Release status. Do not treat the existence of a GitHub Release alone as proof that Marketplace publication is complete.

## AI agent project instructions

AI agents working on this repository must start by reading this `README.md`, then read the authoritative master project document:

`docs/AI_PROJECT_CONTEXT.md`

That document is the project's master source of truth for product direction, architecture, decisions, roadmap, current state, testing rules, release rules, and AI-agent operating rules.

AI agents must:

1. Read `README.md` first.
2. Read `docs/AI_PROJECT_CONTEXT.md` before making project-level decisions or implementation changes.
3. Inspect the current repository state and relevant source/workflows.
4. Build their working task prompt from the documented objective, constraints, acceptance criteria, and relevant decision/roadmap item.
5. Follow the documented product boundary and never reintroduce removed architecture without an explicit product decision.
6. Verify work with appropriate tests and real workflow/release evidence where applicable.
7. Update affected project documentation in the same work session.
8. Leave the repository accurate for the next AI agent.
9. Do not declare meaningful work complete until implementation, verification, and required documentation are synchronized.

**Documentation is part of the implementation. If code and project documentation disagree, investigate current repository/GitHub evidence and restore consistency rather than silently choosing one.**
