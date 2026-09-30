# Contributing to DevLens

DevLens is a GitHub Action. The core product is the composite Action in `action.yml` and its scorer in `scripts/devlens.py`.

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
4. Update `README.md` and `docs/index.md`.
5. Run the live GitHub Actions integration workflow.

## Pull requests

Open a PR against `main` with a clear description of the scoring or Action behavior being changed.

The integration workflow executes the real Action against GitHub's API, so changes must preserve valid authentication, outputs, 0–100 bounds, all nine dimension keys, and safe README persistence when enabled.
