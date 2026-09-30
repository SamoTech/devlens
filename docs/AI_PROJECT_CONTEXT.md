# DevLens — AI Project Context

> **Status: AUTHORITATIVE — MASTER PROJECT DOCUMENTATION**
>
> **Last updated:** 2026-09-30
>
> **Rule:** Any AI agent, coding agent, automation agent, or human contributor working on DevLens must read `README.md` first, then read this document before making project-level decisions or changes. If implementation and documentation disagree, do not guess: verify the repository state and update the documentation to restore consistency.

## 0. Project knowledge classification

Every important project statement should be classified using one of these labels:

- **FACT** — verified from the current repository, GitHub state, workflow evidence, or another directly verifiable source.
- **DECISION** — explicitly approved product or architecture direction. Agents must follow it unless the product owner changes it.
- **PLAN** — intended future work that is not implemented yet.
- **BLOCKER** — an unresolved issue currently preventing a milestone or release.
- **EXPERIMENT** — an optional hypothesis or trial that may be changed, rejected, or discarded.

Agents must never convert a **PLAN**, **BLOCKER**, or **EXPERIMENT** into a **FACT** merely because it appears in documentation. When status changes, update the classification and supporting evidence.

## 1. Purpose and authority

This file is the persistent operating context for DevLens.

It exists so a new AI agent can enter the repository, understand the product without relying on previous chat history, form its work prompt from documented project state, execute work within product boundaries, and leave a state the next agent can continue from.

This is the **master source of truth for product direction, architecture, decisions, roadmap, operating rules, and current-state handoff**. The repository itself is authoritative for implementation; GitHub Actions runs, commit history, releases, tags, and verified repository files are authoritative for implementation and release status.

### Authority hierarchy

When sources conflict:

1. Current implementation in the repository.
2. This master project document for product direction, decisions, roadmap, and agent rules.
3. `README.md` for public product behavior and usage.
4. Other repository documentation.
5. Historical commits, old issues, old PRs, cached search results, or previous AI conversations.

If implementation violates an explicit product decision, do not silently reinterpret the decision. Document the discrepancy and fix the implementation or escalate the decision.

## 1A. AI repository governance model

The repository follows a mandatory AI management hierarchy:

**Human Owner → AI CEO/CIO → AI COO → AI Specialists / AI Engineers / AI Reviewers → Repository / Product.**

- **Human Owner:** final authority over the repository and product.
- **AI CEO/CIO:** strategic decision maker for product direction, major architecture, major trade-offs, business objectives, and high-impact approvals.
- **AI COO:** execution owner for translating CEO/CIO decisions into work, inspecting repository state, coordinating agents, executing appropriate work, verifying results, maintaining repository health/documentation, and reporting blockers and risks.
- **Specialized agents:** execute bounded implementation/review tasks under COO coordination.

The COO must not silently override a CEO/CIO decision. Product direction, major feature scope, fundamental architecture, breaking API changes, destructive operations, significant security implications, business-model changes, or conflicting strategic requirements must be escalated.

### Mandatory documentation gate

Documentation is part of implementation, not a follow-up task. Before meaningful repository work is declared complete, the COO must verify implementation, tests, results, security implications, affected documentation, project status, roadmap/decision updates when applicable, known risks, and a single next action. Missing required documentation or verification means the work remains **IN PROGRESS**, **BLOCKED**, **PARTIALLY COMPLETE**, **IMPLEMENTED — NOT VERIFIED**, or **VERIFIED — DOCUMENTATION PENDING**, as appropriate.

### Persistent handoff rule

A new AI agent must be able to determine from repository documentation what happened, why, what changed, what was verified, what failed, what remains, and which decision governs the next step. Conversation history is not an acceptable substitute for repository state.

## 2. AI agent startup protocol

Every AI agent entering this repository must:

1. Read `README.md`.
2. Read `docs/AI_PROJECT_CONTEXT.md`.
3. Inspect current Git status/current branch and relevant current files.
4. Inspect the implementation and workflow files related to the requested task.
5. Determine whether the requested work fits the product boundary and roadmap.
6. Form a task prompt from the current objective, constraints, acceptance criteria, and relevant decision/roadmap item.
7. Make the smallest correct change that advances the objective.
8. Run appropriate validation, preferably the real GitHub Actions integration workflow for Action behavior.
9. Verify claims against actual workflow/release/tag evidence when applicable.
10. Update affected documentation in the same work session.
11. Leave a clear handoff: objective, implementation, verification, documentation changes, remaining work, and next action.

Do not implement an isolated user request while ignoring this context.

## 3. Product definition

**DevLens is a GitHub Action that scores a repository's engineering health across nine transparent dimensions and publishes the result inside the repository's GitHub context.**

Primary UX:

**Install Action → run analysis → inspect score/report → optionally persist report in README → optionally gate CI.**

DevLens operates on the repository where the Action is installed. No DevLens account, hosted database, or DevLens-hosted application is required.

### Current outputs

- Overall health score: 0–100.
- Nine dimension scores.
- GitHub Actions job summary.
- `health_score` output.
- `badge_url` output.
- `report_json` output.
- Optional README persistence between managed markers.
- Optional CI threshold through `fail_on_score_below`.
- Optional Discord notification.

## 4. Hard product boundary

DevLens must remain:

- GitHub Action-first.
- Repository-local in execution and output.
- Transparent and evidence-based.
- Useful without a DevLens account.
- Useful without DevLens-hosted state.
- Useful without a DevLens web dashboard.

Do not reintroduce:

- Hosted DevLens dashboard.
- DevLens SaaS account/login requirement.
- Supabase or another hosted database as core dependency.
- Vercel-hosted DevLens application as product runtime.
- Fleet/cloud administration panel.
- Mandatory phone, desktop, browser, or SSH controller.
- Mandatory external LLM/AI provider for scoring.
- Opaque AI-generated health score.
- Separate scanner product duplicating the Action.
- Repository registration with DevLens before the Action can run.

A future enhancement may add capabilities around the Action only if it preserves this boundary unless the product owner explicitly changes it.

## 5. Product principles

1. **GitHub-native:** GitHub Actions and the repository are the primary product surface.
2. **Zero hosted service:** Core functionality works without DevLens infrastructure.
3. **Transparent scoring:** Scores come from documented signals and deterministic rules.
4. **Evidence over claims:** Missing evidence must not be converted into an unjustifiably high score.
5. **Safe persistence:** README writes are bounded to the managed block.
6. **CI-friendly:** Outputs and thresholds work naturally in workflows.
7. **Least privilege:** Workflows request only required permissions.
8. **Versioned usage:** Production users consume released major versions such as `@v2`, not `@main`.
9. **Backward compatibility:** Input/output/scoring changes require deliberate versioning.
10. **Verifiable delivery:** Do not declare Action behavior complete from source inspection when end-to-end evidence is available.
11. **Documentation continuity:** Project knowledge must survive across agents and conversations.
12. **Small, purposeful changes:** Avoid unrelated refactors.

## 6. Current architecture

Core implementation:

- `action.yml` — public Action definition, inputs, outputs, and execution entry point.
- `scripts/devlens.py` — analysis, scoring, reporting, README persistence, optional notification, and CI gate.
- `.github/workflows/` — validation, live integration, and release automation.
- `README.md` — public product documentation and installation.
- `docs/` — project/technical documentation.
- `CONTRIBUTING.md` — contributor workflow.
- `SECURITY.md` — security policy.
- `CHANGELOG.md` — release history.

Runtime is Python with pinned direct dependencies in `requirements.txt`:

- `requests==2.34.2`
- `PyGithub==2.10.0`

The Action supports GitHub Enterprise through `GITHUB_API_URL`.

## 7. Scoring specification

Current model identifier:

`action-v2-9d`

| Dimension | Weight |
|---|---:|
| README Quality | 20% |
| Commit Activity | 20% |
| Repo Freshness | 10% |
| Documentation | 10% |
| CI/CD Setup | 10% |
| Issue Response | 10% |
| Community Signal | 5% |
| PR Velocity | 10% |
| Security | 5% |

The weighted health score is bounded to 0–100 and is not artificially forced to 100.

Important rules:

- Commit activity uses a 90-day window.
- Community signal is derived from repository activity signals.
- Documentation scoring reflects expected project documentation.
- Security scoring remains conservative when relevant GitHub security APIs are unavailable.
- API unavailability must not be converted into an unjustifiably high security score.
- Scoring-model changes require implementation, tests, public docs, changelog, and this document to be updated.

The exact implementation in `scripts/devlens.py` is authoritative for current behavior.

## 8. Action contract

Inputs:

- `github_token` — required.
- `badge_style` — default `flat`.
- `update_readme` — default `true`.
- `readme_branch` — empty means repository default branch.
- `notify_discord` — optional.
- `fail_on_score_below` — optional.

Outputs:

- `health_score`
- `badge_url`
- `report_json`

Production reference:

`SamoTech/devlens@v2`

Do not replace the documented production reference with `@main`.

## 9. README persistence contract

When `update_readme: true`, DevLens maintains:

```markdown
<!-- DEVLENS:START -->
...managed report...
<!-- DEVLENS:END -->
```

Only that managed block is replaced. If markers do not exist, the implementation creates/appends the block.

Target branch:

- `readme_branch` when supplied.
- Otherwise repository default branch.

Explicit README persistence failure must fail the Action. With `update_readme: false`, the Action must not intentionally mutate README.

## 10. CI and security contract

Recommended permissions:

- `contents: write` when README persistence is enabled.
- `security-events: read` when security API checks are desired.

The Action honors the supplied GitHub token and GitHub API base URL.

`fail_on_score_below` is a CI policy mechanism only; it does not alter the calculated score.

No secrets, tokens, or webhook credentials may be committed.

## 11. Testing contract

### Static validation

At minimum:

- Python compilation succeeds.
- Action metadata is valid.
- Pinned runtime dependencies are present.
- Documentation remains consistent with inputs/outputs.

### Live Action validation

The release preflight and integration workflows execute the actual composite Action and verify:

- score is 0–100;
- report JSON is valid;
- expected report keys exist;
- model identifier is `action-v2-9d`;
- action version is valid `2.x.x`;
- all nine dimensions exist;
- badge output is produced.

### README persistence validation

Persistence must be tested against a disposable branch, not production. The integration workflow must create the branch, execute the real Action, verify managed markers through GitHub API, and clean up the branch.

Claims of successful persistence require actual integration evidence or equivalent direct verification.

## 12. Release and distribution policy

The v2 release line uses:

- semantic versioned releases such as `v2.0.1`;
- floating major tag `v2`;
- production consumption through `@v2`;
- GitHub Releases;
- GitHub Marketplace distribution.

### Automated release flow

`.github/workflows/release.yml` is authoritative for release automation.

Manual release:

1. Run **Create Release** via `workflow_dispatch`.
2. Supply a strict `v2.x.x` version tag.
3. The dispatch job creates only the versioned tag.
4. The resulting tag push triggers the release job exactly once.
5. Release preflight runs static validation and the real Action.
6. The release job updates the floating `v2` tag to that version.
7. GitHub Release is published.

Future version-tag pushes matching `v2.*.*` also trigger the release job.

The workflow must not hard-code a specific patch/minor Action version. Preflight validates that the Action reports a valid `2.x.x` version.

The floating `v2` tag is intentionally mutable; versioned release tags are not overwritten.

### Current verified release state

As of 2026-09-30:

- `v2.0.0` exists as the original Marketplace release tag.
- `v2.0.1` was created by the automated release workflow.
- `v2` exists and was successfully moved to `v2.0.1`.
- `v2.0.1` GitHub Release was published successfully.
- Release preflight executed the real Action and produced **85/100** using `action-v2-9d`.
- The release run verified all nine score keys and a valid 2.x.x Action version.
- Release workflow hardening was committed in `7f7df1aae8e1ddd8be3c4d19265a8810eb66c9c7`.
- The release workflow run triggered by that commit was observed running successfully through the bootstrap job.
- Production usage is `SamoTech/devlens@v2`.

Marketplace publication status must be verified separately from GitHub Release status. A GitHub Release is not automatically treated as Marketplace publication unless GitHub shows the Marketplace association.

## 13. Current verified project state

As of 2026-09-30:

- Product architecture is Action-only.
- Dashboard code is removed from the main product.
- Vercel configuration is removed from the repository.
- Legacy scanner code is removed.
- Legacy Groq scoring dependencies/inputs are removed.
- README, contributor, security, documentation, and changelog materials are aligned with v2, subject to the current release-state documentation updates.
- Live GitHub integration has executed the actual Action successfully.
- README persistence has been tested on a disposable branch and verified through GitHub API.
- Current release line is v2; `v2.0.1` is the latest verified version.
- Floating `v2` points to the latest verified v2 release.
- Repository release automation has been hardened to avoid duplicate manual/tag-triggered releases.
- Repository metadata may still contain stale external/homepage information and should be verified before treating metadata cleanup as complete.
- Any external Vercel project state must be verified separately; removing repository configuration does not prove external project deletion.

## 14. Roadmap

Roadmap entries are **PLAN**, not facts.

### Phase 0 — Foundation — COMPLETE

- Action-only architecture.
- Remove hosted dashboard.
- Remove legacy scanner.
- Remove mandatory external AI scoring.
- Stabilize 9-dimension v2 scoring.
- README persistence.
- Configurable README branch.
- CI threshold.
- Live integration testing.
- Disposable-branch README persistence testing.
- Documentation alignment.

### Phase 1 — Release and distribution — COMPLETE

- Establish v2 release line.
- Establish floating `v2` tag.
- Automated versioned release workflow.
- Release preflight.
- Pinned runtime dependencies.
- GitHub Marketplace distribution path.
- End-to-end release verification.

Remaining Phase 1 operational check:

- **BLOCKER:** Publish/update the Marketplace listing to the current v2 release. The live Marketplace page currently exposes the legacy `v1.0.3` listing snapshot and obsolete hosted-dashboard documentation; repository changes alone do not update that published release snapshot.
- Clean any stale repository metadata.

### Phase 2 — Adoption and onboarding — NEXT

- Improve README installation flow.
- Add clearer examples for common repository types.
- Improve failure messages/remediation guidance.
- Document permissions/security implications precisely.
- Provide troubleshooting based on real Action failures.

### Phase 3 — Scoring quality and observability

- Expand automated edge-case tests.
- Improve evidence shown for individual dimension scores.
- Reduce unnecessary API calls and startup cost.
- Improve sparse-history behavior.
- Improve GitHub Enterprise compatibility.
- Establish regression fixtures.

### Phase 4 — Ecosystem integrations

Only pursue integrations that preserve the Action-first boundary, such as richer GitHub-native reporting or workflow annotations.

### Phase 5 — Advanced repository-local capabilities

Candidates may include richer PR/CI feedback, repository-owned historical artifacts, and additional machine-readable outputs. Each candidate must preserve GitHub-native execution, no DevLens account, no DevLens-hosted state, transparent scoring, and end-to-end testability.

## 15. AI agent development rules

Every AI agent must:

- Read `README.md` first.
- Read this master document before project-level implementation.
- Treat the current repository and current GitHub state as authoritative for implementation status.
- Use documented product boundaries to resolve ambiguity.
- Build its task prompt from objective, constraints, acceptance criteria, and relevant roadmap/decision.
- Inspect current implementation before architectural changes.
- Prefer the smallest correct change.
- Preserve working behavior unless the task explicitly changes it.
- Run appropriate tests.
- Use real workflow/release evidence for claims about Action behavior.
- Update affected documentation in the same work session.
- Record important product/architecture decisions in the decision log.
- Leave a clear handoff.

An AI agent must not:

- Reintroduce the dashboard without an explicit product decision.
- Reintroduce Vercel/Supabase as core architecture.
- Add external AI scoring for convenience.
- Claim tests passed without evidence.
- Claim a release is shipped when only planned.
- Treat historical code/search results as current architecture.
- Delete working behavior without understanding its role.
- Add undocumented product behavior.
- Change scoring weights/semantics without updating specification and changelog.
- Replace `@v2` production usage with `@main`.
- Treat a floating major tag as immutable.
- Assume Marketplace publication from a GitHub Release alone.

## 16. Documentation maintenance rule

**Documentation is part of the implementation.**

Whenever an agent changes product scope, architecture, Action inputs/outputs, scoring, README persistence, permissions, workflows, release process, roadmap, testing contract, security behavior, blockers, or important decisions, it must review:

- `README.md`
- `docs/AI_PROJECT_CONTEXT.md`
- `docs/index.md`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `CHANGELOG.md`

Not every file must be edited every time. Every affected file must remain accurate.

If code and documentation disagree, investigate the repository and GitHub evidence and restore consistency.

## 17. Decision log

### D-001 — Action-only product
**Status:** DECISION / ACTIVE.  
DevLens is a GitHub Action product rather than hosted dashboard/SaaS.

### D-002 — Dashboard removed
**Status:** DECISION / ACTIVE.  
Agents must not rebuild dashboard routes, Vercel runtime code, or dashboard persistence.

### D-003 — No mandatory external AI scoring
**Status:** DECISION / ACTIVE.  
Core health scoring is deterministic and repository-signal based.

### D-004 — Nine-dimension v2 model
**Status:** DECISION / ACTIVE.  
The public scoring contract uses nine weighted dimensions.

### D-005 — README as repository-local output
**Status:** DECISION / ACTIVE.  
DevLens may persist its report in the user's README using managed markers.

### D-006 — Disposable-branch integration testing
**Status:** DECISION / ACTIVE.  
README persistence is verified against a disposable branch.

### D-007 — Documentation as persistent agent memory
**Status:** DECISION / ACTIVE.  
This master document is durable project context for future AI agents.

### D-008 — Release preflight and pinned runtime dependencies
**Status:** DECISION / ACTIVE.  
The release path validates the real Action and uses pinned direct Python dependencies.

### D-009 — GitHub Marketplace distribution
**Status:** DECISION / ACTIVE.  
DevLens v2 is distributed as a GitHub Marketplace Action. PyPI is not a product distribution target.

### D-010 — Automated semantic v2 release flow
**Status:** DECISION / ACTIVE.  
Manual release dispatch creates only a versioned `v2.x.x` tag; the tag push owns the release operation. The release workflow then validates, moves floating `v2`, and publishes the GitHub Release.

**Consequence:** A manual release does not independently publish a second release after pushing the tag. Versioned release tags are immutable; the `v2` major tag is intentionally mutable.

## 18. Agent handoff template

**Objective**
- What was requested.

**Implemented**
- Files changed.
- Behavior changed.
- Product/architecture impact.

**Verification**
- Tests.
- Workflow run IDs / release tags / commit SHAs.
- Limitations.

**Documentation**
- Documents updated.
- Decisions or roadmap changes.

**Remaining**
- Blockers.
- Follow-up work.
- Unverified assumptions.

**Next agent**
- Single most useful next action.

## 19. Source-of-truth warnings

Do not trust these as current truth without verification:

- Old AI conversation summaries.
- Cached GitHub search results.
- Historical dashboard code.
- Closed PR descriptions of former architecture.
- Planned changelog entries.
- Old README score snapshots.
- Old Vercel state.

When uncertain, inspect current repository files and current GitHub Actions/release/tag state.

## 20. Current working objective

**Primary objective:** Establish DevLens v2 as a reliable, GitHub-native repository health Action and increase adoption without violating the Action-only product boundary.

The next agent should first verify the current public distribution/Marketplace state, then work on the highest-priority unresolved adoption or metadata item rather than inventing a new product direction.
