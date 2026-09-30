# Changelog

All notable changes to DevLens, newest first.

## Unreleased

### Changed
- DevLens is now a GitHub Action-only product.
- Removed the hosted dashboard, Next.js application, Redis persistence, and Vercel deployment configuration.
- Repository selection is now implicit: the Action scores the GitHub repository in which the workflow runs.
- README scoring is the primary persistent result surface.
- Added a live GitHub API integration test that executes the real Action and validates its outputs.
- Added a GitHub Actions job summary containing the complete 9-dimension report.
- Aligned Action documentation and displayed weights with the scoring model.

## 0.4.0

### Added
- Expanded scoring to 9 dimensions: PR Velocity and Security.
- GitHub Action outputs for the overall score, badge URL, and complete JSON report.
- Automatic README health block between DevLens markers.
