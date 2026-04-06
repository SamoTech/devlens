# Contributing to DevLens

Thanks for your interest! DevLens has two main parts — the **Next.js dashboard** (`dashboard/`) and the **GitHub Action scripts** (`scripts/`). Contributions to either are welcome.

---

## Dashboard (Next.js)

```bash
git clone https://github.com/SamoTech/devlens
cd devlens/dashboard
npm install
cp .env.example .env.local   # fill in env vars (see dashboard/README.md)
npm run dev                   # → http://localhost:3000
```

**Stack:** Next.js 15 (App Router) · TypeScript · Upstash Redis · NextAuth v5 · Vercel

### Adding or modifying a scoring dimension

1. Edit `dashboard/lib/scorer.ts` — add or adjust the `score_xxx()` function
2. Update `dashboard/lib/constants.ts` — add the key to `DimKey` and `DEFAULT_WEIGHTS`
3. Update dimension metadata in `dashboard/components/RepoCard.tsx` (label, emoji, description)
4. Update the docs page (`dashboard/app/docs/page.tsx`) with the new scoring logic
5. Submit a PR with a clear description of the metric rationale and scoring formula

### API routes

All API routes live in `dashboard/app/api/`. Each route is a standard Next.js Route Handler (`route.ts`).
Redis integration uses `dashboard/lib/redis.ts` (Upstash REST client).

---

## Scripts / GitHub Action

```bash
git clone https://github.com/SamoTech/devlens
cd devlens
pip install requests PyGithub python-dateutil
export GITHUB_TOKEN=your_token
export REPO=owner/repo-name
python scripts/devlens.py
```

**Note:** The Python scripts power the GitHub Action (`action.yml`). The dashboard uses its own TypeScript scorer in `dashboard/lib/scorer.ts`.

### Adding a scoring dimension to the Action

1. Write a `score_xxx()` function in `scripts/devlens.py`
2. Add it to the `weights` dict (weights must sum to 1.0)
3. Add the new output to `action.yml` outputs if relevant
4. Submit a PR with a description of the metric rationale

---

## Code Style

- **TypeScript:** strict mode, no `any`, descriptive names
- **Python:** PEP8, descriptive names, comment complex logic
- All PRs should include a description of what changed and why

## Pull Request Process

1. Fork the repo and create a feature branch: `git checkout -b feat/my-feature`
2. Make your changes, test locally
3. Open a PR against `main` with a clear title and description
4. A maintainer will review within a few days

## Reporting Bugs

Open an issue at [github.com/SamoTech/devlens/issues](https://github.com/SamoTech/devlens/issues) with steps to reproduce.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).
