# Contributing to DevLens

## Quick Setup
```bash
git clone https://github.com/SamoTech/devlens
cd devlens
pip install requests PyGithub python-dateutil
export GITHUB_TOKEN=your_token
export REPO=owner/repo-name
python scripts/devlens.py
```

## Adding a Scoring Dimension
1. Write a `score_xxx()` function in `scripts/devlens.py`
2. Add it to the `weights` dict (weights must sum to 1.0)
3. Submit a PR with a description of the metric rationale

## Code Style
- PEP8 Python, descriptive names, comment complex logic
- All PRs should include a test case or example
