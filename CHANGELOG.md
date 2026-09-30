# Changelog

All notable changes to DevLens, newest first.

## v2.0.9 — 2026-09-30

- Corrected Issue Response scoring to exclude pull requests from issue counts.
- Changed Commit Activity to count commits through GitHub search without materializing the full commit history.
- Changed Documentation detection to avoid recursive-tree truncation.
- Redefined PR Velocity as merged-PR throughput over the same 90-day window as Commit Activity.
- Added deterministic regression fixtures for issue-response scoring.
- Updated live integration expectations for `v2.0.9`.

### Documentation and distribution status
- Verified by the Human Owner that the live GitHub Marketplace listing displays **DevLens Repo Health** as **Latest v2.0.8** with the current Action-only product content.
- Closed the Marketplace publication/verification blocker and advanced the project to Phase 2 — Adoption and onboarding.
- Improved the README onboarding funnel with explicit recommended, read-only, and CI-gate installation paths.
- Added a first-run checklist and common first-run failure/remediation guidance, including permissions and README persistence checks.
- Added concrete onboarding examples for application/service, library/package, monorepo, and restricted/read-only repository patterns.
- Verified the real DevLens Action through PR-triggered live integration run `36700821668`; the run completed successfully.
- Verified onboarding failure paths in run `36701199169`: invalid score threshold and read-only README persistence both failed with the expected actionable errors.
- Closed Phase 2 onboarding validation; no runtime defect was identified.

## 2.0.8 — 2026-09-30

### Release hardening
- Bumped the machine-readable Action version to `2.0.8`.
- Hardened the automatic release workflow so static/live preflight runs before a new versioned release tag is created.
- Added an immutable-tag safety check that rejects an existing versioned tag pointing to a different commit.
- Updated live integration validation to require Action version `2.0.8`.

### Verification
- Automatic release workflow run `36698433347` completed successfully.
- Static validation, real Action preflight, release-candidate validation, versioned tag creation, floating `v2` update, and GitHub Release publication all passed.
- Live integration run `36698433209` completed successfully, including disposable-branch README persistence verification.
- `v2.0.8` is the latest GitHub Release and floating `v2` points to the `v2.0.8` release tag.

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
