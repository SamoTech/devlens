# Changelog

All notable changes to DevLens, newest first.

## Unreleased — 2026-09-30

### Documentation synchronization
- Updated public and master documentation to the verified `v2.0.7` release state.
- Recorded automatic critical-change release verification and the corrected Action version reporting.

## 2.0.1 — 2026-09-30

### Release and distribution
- Established the automated v2 release flow.
- Published the `v2.0.1` GitHub Release.
- Updated the floating `v2` consumer tag to `v2.0.1`.
- Hardened release triggering so a manual release creates only the versioned tag; the tag push owns the release operation.
- Added strict `v2.x.x` release-tag validation.
- Removed the hard-coded `2.0.0` Action-version assertion from release preflight.
- Updated release workflow dependencies for the current GitHub Actions runtime.

### Marketplace and onboarding audit
- Audited the live GitHub Marketplace listing and found it still serving the legacy `v1.0.3` snapshot with obsolete dashboard/Vercel content.
- Improved the repository Action metadata and README installation funnel for the v2 Action-only product.
- Manually published/updated the Marketplace listing to expose `v2.0.1` as the current Marketplace version.

### Documentation and agent continuity
- Updated the authoritative AI project context with verified v2.0.1 release state.
- Documented the automated release architecture and floating `v2` policy.
- Aligned README Marketplace and production-version information with the latest verified release.
- Reinforced the repository rule that AI agents must read the README and master project context before project-level changes.

### Verification
- Release preflight executed the actual DevLens Action successfully.
- Verified score: **85/100**.
- Verified model: `action-v2-9d`.
- Verified all nine scoring dimensions.
- Verified `v2` was moved to the released version.

## 2.0.0 — 2026-09-30

### Marketplace and release distribution
- Prepared the v2 release for GitHub Marketplace distribution using the existing `DevLens Repo Health` listing.
- The intended distribution path is the semantic GitHub release plus floating `v2` tag; no PyPI package is required.

### Security and release hardening
- Pinned direct Python runtime dependencies in `requirements.txt` for reproducible Action startup.
- Added live release preflight validation before tag creation.
- Release workflow refuses to overwrite an existing versioned release tag.

### Changed
- DevLens is now a GitHub Action-only product with no dashboard, database, or Vercel runtime.
- Removed the hosted dashboard, Next.js application, Redis persistence, and Vercel deployment configuration.
- Repository selection is implicit: the Action scores the GitHub repository in which the workflow runs.
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
