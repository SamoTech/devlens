# Changelog

All notable changes to DevLens, newest first.

## Unreleased

> Target release: v2.0.0

## 2.0.0 (planned)

### Marketplace and release distribution
- Prepared the v2 release for GitHub Marketplace distribution using the existing `DevLens Repo Health` listing.
- The intended distribution path is the semantic GitHub release `v2.0.0` plus floating `v2` tag; no PyPI package is required.

### Security and release hardening
- Pinned direct Python runtime dependencies in `requirements.txt` for reproducible Action startup.
- Added live release preflight validation before tag creation.
- Release workflow now refuses to overwrite an existing versioned release tag.

### Changed
- DevLens is now a GitHub Action-only product with no dashboard, database, or Vercel runtime.
- Removed the hosted dashboard, Next.js application, Redis persistence, and Vercel deployment configuration.
- Repository selection is now implicit: the Action scores the GitHub repository in which the workflow runs.
- README scoring is the primary persistent result surface.
- Added a live GitHub API integration test that executes the real Action and validates its outputs.
- Added safe `readme_branch` targeting for end-to-end README persistence tests.
- Removed deprecated Groq inputs and made README write failures fail the Action instead of being silently ignored.
- Switched GitHub API access to `GITHUB_API_URL` for GitHub Enterprise compatibility.
- Fixed the 90-day activity window calculation for short calendar months.
- Added a GitHub Actions job summary containing the complete 9-dimension report.
- Aligned Action documentation and displayed weights with the scoring model.

## 0.4.0

### Added
- Expanded scoring to 9 dimensions: PR Velocity and Security.
- GitHub Action outputs for the overall score, badge URL, and complete JSON report.
- Automatic README health block between DevLens markers.
