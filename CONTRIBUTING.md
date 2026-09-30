# Contributing to DevLens

DevLens is a GitHub Action. The core product is the composite Action in `action.yml` and its scorer in `scripts/devlens.py`.

## AI agent startup requirement

Any AI agent entering this repository must read `README.md` first and then read:

`docs/AI_PROJECT_CONTEXT.md`

`docs/AI_PROJECT_CONTEXT.md` is the authoritative master documentation for product direction, architecture, decisions, roadmap, current state, testing, and agent operating rules.

AI agents must form their implementation prompt from that documented context, inspect the current implementation before changing it, verify their work, and update affected documentation in the same work session.

Do not reintroduce removed dashboard/SaaS architecture or treat historical code and old conversations as current product requirements.

## Local development

```bash
git clone https://github.com/SamoTech/devlens
cd devlens
python -m py_compile scripts/devlens.py
```

For a live local execution:

```bash
pip install requests PyGithub
export GITHUB_TOKEN=your_token
export REPO=owner/repository
python scripts/devlens.py
```

## Scoring changes

When changing a scoring dimension:

1. Update the scoring function in `scripts/devlens.py`.
2. Keep the weights aligned with the 9-dimension model.
3. Update `action.yml` if inputs or outputs change.
4. Update `README.md`, `docs/index.md`, and `docs/AI_PROJECT_CONTEXT.md` when affected.
5. Update `CHANGELOG.md` when the change is release-impacting.
6. Run the live GitHub Actions integration workflow.

## Pull requests

Open a PR against `main` with a clear description of the scoring or Action behavior being changed.

The integration workflow executes the real Action against GitHub's API, so changes must preserve valid authentication, outputs, 0–100 bounds, all nine dimension keys, and safe README persistence when enabled.
