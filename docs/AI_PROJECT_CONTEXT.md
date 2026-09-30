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

## 1. Purpose of this document

This file is the persistent operating context for DevLens.

It exists so that a new AI agent can enter the repository, understand the product without relying on previous chat history, form its work prompt from the documented project state, execute work within the product boundaries, and leave the repository in a state that the next agent can continue from.

This document is the **master source of truth for project direction, architecture, decisions, roadmap, operating rules, and current-state handoff**.

The repository itself is the source of truth for implementation. GitHub Actions runs, commit history, and verified repository files are the source of truth for implementation status.

### Authority hierarchy

When sources conflict, use this order:

1. Current implementation in the repository.
2. This master project document for product direction, decisions, roadmap, and agent rules.
3. `README.md` for public product behavior and user-facing usage.
4. Other repository documentation.
5. Historical commits, old issues, old PRs, cached search results, or previous AI conversations.

If a conflict reveals that the implementation violates an explicit product decision, do not silently reinterpret the decision. Document the discrepancy and fix the implementation or escalate the decision.

## 2. AI agent startup protocol

Every AI agent entering this repository must follow this sequence:

1. Read `README.md`.
2. Read `docs/AI_PROJECT_CONTEXT.md`.
3. Inspect the current Git status and relevant current files.
4. Read the specific implementation and workflow files related to the requested task.
5. Determine whether the requested work is consistent with the product boundary and roadmap.
6. Form the agent's working prompt from the current documented objective, constraints, and acceptance criteria.
7. Make the smallest correct change that advances the objective.
8. Run the appropriate validation, preferably the real GitHub Actions integration workflow for Action behavior.
9. Update documentation whenever the work changes product behavior, architecture, decisions, roadmap, operational rules, or project state.
10. Leave a clear handoff: what changed, what was verified, what remains, and what the next agent should do.

An agent must not begin implementation from an isolated user prompt while ignoring the repository's documented context.

## 3. Product definition

**DevLens is a GitHub Action that scores a repository's engineering health across nine transparent dimensions and publishes the result inside the repository's GitHub context.**

The primary user experience is:

**Install Action → run analysis → inspect score/report → optionally persist report in README → optionally gate CI.**

DevLens operates on the repository where the Action is installed.

The product is intentionally GitHub-native and repository-local. It does not require users to create a DevLens account or send their repository to a DevLens-hosted application.

### Current product outputs

DevLens can provide:

- Overall health score: 0–100.
- Nine dimension scores.
- GitHub Actions job summary.
- `health_score` Action output.
- `badge_url` Action output.
- `report_json` Action output.
- Optional README persistence between managed markers.
- Optional CI failure threshold through `fail_on_score_below`.
- Optional Discord notification.

## 4. Problem DevLens solves

Repositories accumulate signals about maintainability, activity, documentation, automation, collaboration, and security, but those signals are distributed across GitHub.

DevLens turns those existing repository signals into a compact, reproducible health model that is visible where developers already work: GitHub.

The core value proposition is not a hosted analytics dashboard. The core value proposition is **a reusable GitHub-native Action that creates an understandable health signal inside the repository and CI workflow itself**.

## 5. Hard product boundary

These are product constraints, not temporary implementation details.

### DevLens must remain

- A GitHub Action-first product.
- Usable by adding a workflow to the user's repository.
- Repository-local in its execution and output model.
- Transparent enough that users can understand why a score changed.
- Compatible with GitHub Actions and GitHub API semantics.
- Useful without a DevLens account.
- Useful without a DevLens-hosted database.
- Useful without a DevLens web dashboard.

### Do not reintroduce

- A hosted DevLens dashboard.
- A DevLens SaaS account/login requirement.
- Supabase or another hosted database as a core dependency.
- A Vercel-hosted DevLens application as the product runtime.
- A fleet/cloud administration panel.
- A mandatory phone, desktop, browser, or SSH controller.
- A mandatory external LLM or AI provider for scoring.
- An opaque AI-generated health score.
- A separate scanner product that duplicates the Action.
- Architecture that requires users to register repositories with DevLens before the Action can run.

A future enhancement may add capabilities around the Action, but it must preserve the Action-only product boundary unless the product owner explicitly changes that decision.

## 6. Product principles

1. **GitHub-native:** The repository and GitHub Actions are the primary product surface.
2. **Zero hosted service:** Core functionality must work without DevLens infrastructure.
3. **Transparent scoring:** Scores must come from documented signals and deterministic rules.
4. **Evidence over claims:** Do not manufacture a score when evidence is unavailable.
5. **Safe persistence:** README writes must be bounded to the DevLens-managed block.
6. **CI-friendly:** Outputs and failure thresholds must work naturally in workflows.
7. **Least privilege:** Workflows should request only the permissions required for their behavior.
8. **Versioned usage:** Production users should consume a released major version such as `@v2`, not `@main`.
9. **Backward compatibility:** Changes to Action inputs/outputs and scoring behavior require deliberate versioning.
10. **Verifiable delivery:** Never declare a feature complete based only on source inspection when an end-to-end test can verify it.
11. **Documentation continuity:** Project knowledge must survive across agents and conversations.
12. **Small, purposeful changes:** Avoid refactors that do not advance the product objective.

## 7. Current architecture

The core implementation is intentionally small:

- `action.yml` — public GitHub Action definition, inputs, outputs, permissions expectations, and execution entry point.
- `scripts/devlens.py` — repository health analysis, scoring, reporting, README persistence, optional notification, and CI gate behavior.
- `.github/workflows/` — validation, live integration, and release automation.
- `README.md` — public product documentation and installation guide.
- `docs/` — project and technical documentation.
- `CONTRIBUTING.md` — contributor workflow.
- `SECURITY.md` — security policy.
- `CHANGELOG.md` — release history and planned release notes.

The current implementation uses Python with `requests` and `PyGithub`.

The Action supports GitHub Enterprise API configuration through `GITHUB_API_URL`.

## 8. Scoring specification

Current model identifier:

`action-v2-9d`

Current dimensions and weights:

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

The weighted health score is bounded to 0–100.

The implementation must not artificially force a repository to 100.

### Important scoring rules

- Commit activity uses a 90-day window.
- Community signal is derived from repository activity signals and must not be inflated simply to produce a perfect score.
- Documentation scoring reflects the presence and quality of expected project documentation.
- Security scoring must remain conservative when the relevant GitHub security API is unavailable.
- API unavailability must not be converted into an unjustifiably high security score.
- Any scoring-model change must update the implementation, tests, public documentation, and this document.

The exact scoring implementation in `scripts/devlens.py` is authoritative for current behavior. This section describes the product contract and must be updated when that contract changes.

## 9. Action contract

Current inputs:

- `github_token` — required.
- `badge_style` — default `flat`.
- `update_readme` — default `true`.
- `readme_branch` — empty means the repository default branch.
- `notify_discord` — optional.
- `fail_on_score_below` — optional.

Current outputs:

- `health_score`
- `badge_url`
- `report_json`

Production consumers should use:

`SamoTech/devlens@v2`

Do not change the documented production reference to `@main`.

## 10. README persistence contract

When `update_readme: true`, DevLens maintains:

```markdown
<!-- DEVLENS:START -->
...managed report...
<!-- DEVLENS:END -->
```

Only the managed block is replaced.

If the markers do not exist, the implementation creates/appends the block.

The target branch is:

- `readme_branch` when explicitly supplied.
- Otherwise the repository default branch.

If README persistence is explicitly requested and the write fails, the Action must fail rather than silently reporting a successful persistence operation.

When `update_readme: false`, the Action must not intentionally mutate the README.

## 11. CI and security contract

The recommended workflow grants:

- `contents: write` when README persistence is enabled.
- `security-events: read` when security API checks are desired.

The Action must honor the supplied GitHub token and GitHub API base URL.

The `fail_on_score_below` input is a CI policy mechanism. It must not change the calculated score; it only determines whether the Action exits successfully after scoring.

No secrets, tokens, or webhook credentials may be committed to the repository.

## 12. Testing contract

DevLens must be validated at multiple levels.

### Static validation

At minimum:

- Python compilation succeeds.
- Action metadata is valid.
- Documentation remains consistent with current inputs/outputs.

### Live Action validation

The live integration workflow must execute the actual Action and verify:

- score is within 0–100;
- report JSON is valid;
- expected report keys exist;
- model identifier is `action-v2-9d`;
- action version is correct;
- all nine dimensions are present;
- badge output is produced.

### README persistence validation

Persistence must be tested against a disposable branch, not the production branch.

The integration workflow should:

1. Create a temporary branch.
2. Run the actual Action with `update_readme: true`.
3. Verify the managed README markers through the GitHub API.
4. Delete the temporary branch even when the test fails.

A claim that README persistence works must be backed by an actual successful integration run or equivalent direct verification.

## 13. Release and versioning policy

The current target is the v2 release line.

The intended release model is:

- semantic versioned release such as `v2.0.0`;
- floating major tag `v2`;
- production workflows consume `@v2`;
- release notes describe user-visible changes;
- release status is not considered complete until the release/tag has been verified.

Do not call a release "shipped" merely because `CHANGELOG.md` says it is planned.

The repository's release workflow is the intended mechanism for creating the versioned tag, updating the floating major tag, and publishing the GitHub release.

Marketplace publication is a release/distribution step, not proof that the implementation itself is complete.

## 14. Current verified state

As of 2026-09-30:

- Product architecture is Action-only.
- Dashboard code has been removed from the main product.
- Vercel configuration has been removed from the repository.
- Legacy scanner code has been removed.
- Legacy Groq scoring dependencies/inputs have been removed.
- README, contributor, security, documentation, and changelog materials have been aligned with v2.
- Live GitHub integration has successfully executed the actual Action.
- README persistence has successfully been tested on a disposable branch and verified through the GitHub API.
- Current repository state has no open PRs and no open issues.
- v2.0.0 is planned but must not be represented as already released until the release/tag is actually verified.
- GitHub repository metadata still has legacy Vercel homepage information and requires cleanup.
- The old Vercel project may still exist externally; repository-side removal of Vercel configuration does not mean the Vercel project has been deleted.

When updating this section, include concrete verification evidence such as commit SHA, workflow run ID, or direct repository state.

## 15. Roadmap

Roadmap entries are plans, not facts. An agent must not represent a PLAN as implemented.

### Phase 0 — Foundation — COMPLETE

- Establish Action-only architecture.
- Remove hosted dashboard architecture.
- Remove legacy scanner.
- Remove mandatory external AI scoring.
- Stabilize the 9-dimension v2 scoring model.
- Add README persistence.
- Add configurable README branch.
- Add CI threshold support.
- Add live integration testing.
- Add disposable-branch README persistence testing.
- Align project documentation.

### Phase 1 — Release and distribution — NEXT

**Goal:** make the Action easy to install and safely consume.

Planned work:

- Verify and publish v2.0.0.
- Maintain the `v2` major tag.
- Complete GitHub Marketplace publication.
- Clean stale repository metadata.
- Verify the public installation path end-to-end.
- Ensure release documentation matches the shipped artifact.

### Phase 2 — Adoption and onboarding

**Goal:** reduce friction between discovering DevLens and successfully installing it.

Candidate work:

- Improve README installation flow.
- Add clearer examples for common repository types.
- Improve failure messages and remediation guidance.
- Document permissions and security implications precisely.
- Provide troubleshooting based on real Action failures.

These are planned candidates, not committed features.

### Phase 3 — Scoring quality and observability

**Goal:** improve signal quality without sacrificing transparency.

Candidate work:

- Expand automated edge-case tests for every scoring dimension.
- Improve evidence shown for individual dimension scores.
- Reduce unnecessary API calls and Action startup cost.
- Improve behavior for repositories with sparse history.
- Improve GitHub Enterprise compatibility.
- Establish regression fixtures for scoring changes.

### Phase 4 — Ecosystem integrations

Only pursue integrations that preserve the Action-first boundary.

Potential examples include richer GitHub-native reporting, workflow annotations, or other repository-local outputs.

Do not introduce a hosted database or dashboard merely to support an integration.

### Phase 5 — Advanced repository-local capabilities

Potential future capabilities may include richer PR/CI feedback, historical artifacts stored in the user's own repository/workflow infrastructure, or additional machine-readable outputs.

Every candidate must be evaluated against:

- Does it remain GitHub-native?
- Does it avoid requiring a DevLens account?
- Does it avoid requiring DevLens-hosted state?
- Is the value clear enough to justify added complexity?
- Can it be tested end-to-end?
- Does it preserve transparent scoring?

## 16. Enhancement backlog

Potential improvements should be evaluated and explicitly classified before implementation:

- Action dependency/startup optimization.
- More comprehensive scoring edge-case tests.
- Better score evidence and explainability.
- API-call efficiency/caching where safe.
- GitHub Enterprise compatibility coverage.
- Permission minimization.
- Stronger security evidence when GitHub exposes it.
- Improved CI annotations.
- Optional richer GitHub-native reporting.
- Better release automation and immutable release verification.

Backlog ideas are not commitments. Agents must not silently convert them into product requirements.

## 17. AI agent development rules

Every AI agent must:

- Read `README.md` first.
- Read this master document before project-level implementation.
- Use the documented product boundary to interpret ambiguous requests.
- Build its task prompt from the current objective, constraints, acceptance criteria, and relevant roadmap item.
- Inspect current implementation before proposing or applying architectural changes.
- Prefer the smallest change that solves the requested problem.
- Preserve existing working behavior unless the task explicitly changes it.
- Run appropriate tests after implementation.
- Use actual workflow/run evidence when claiming GitHub Action behavior is verified.
- Update documentation when implementation changes behavior.
- Update this master document when product direction, architecture, roadmap, decisions, operating rules, or verified state changes.
- Keep `README.md` aligned with public behavior.
- Keep `CHANGELOG.md` aligned with release-impacting changes.
- Record important architectural/product decisions in the decision log below.
- Leave a clear handoff for the next agent.

An AI agent must not:

- Reintroduce the dashboard without an explicit product decision.
- Reintroduce Vercel/Supabase as core architecture.
- Add an external AI dependency simply because it is convenient.
- Claim tests passed without running or inspecting evidence.
- Claim a release is shipped when it is only planned.
- Treat stale search results or historical code as current architecture.
- Delete working behavior without understanding its product role.
- Add undocumented product behavior and leave the master documentation stale.
- Change scoring weights or semantics without updating the scoring specification and changelog.

## 18. Documentation maintenance rule

**Documentation is part of the implementation.**

If an agent changes any of the following, it must review and update the relevant documentation in the same work session:

- Product scope.
- Product boundary.
- Action inputs or outputs.
- Scoring dimensions or weights.
- Scoring behavior.
- README persistence.
- Permissions/security behavior.
- Workflows.
- Release process.
- Architecture.
- Roadmap.
- Testing contract.
- Known blockers.
- Important decisions.

At minimum, the agent must check:

- `README.md`
- `docs/AI_PROJECT_CONTEXT.md`
- `docs/index.md`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `CHANGELOG.md`

Not every change requires editing every file, but every affected document must remain accurate.

## 19. Decision log

### D-001 — Action-only product

**Decision:** DevLens is a GitHub Action product rather than a hosted dashboard/SaaS.

**Status:** DECISION / ACTIVE.

**Consequence:** The repository where DevLens is installed is the primary product context. No hosted account or database is required.

### D-002 — Dashboard removed

**Decision:** The dashboard is not part of the current product.

**Status:** DECISION / ACTIVE.

**Consequence:** Agents must not rebuild dashboard routes, Vercel runtime code, or dashboard persistence as part of ordinary feature work.

### D-003 — No mandatory external AI scoring

**Decision:** Core health scoring is deterministic and repository-signal based.

**Status:** DECISION / ACTIVE.

### D-004 — Nine-dimension v2 model

**Decision:** The current public scoring contract uses nine weighted dimensions.

**Status:** DECISION / ACTIVE.

### D-005 — README as repository-local output

**Decision:** DevLens may persist its report directly in the user's README using managed markers.

**Status:** DECISION / ACTIVE.

### D-006 — Disposable-branch integration testing

**Decision:** README persistence must be verified against a disposable branch rather than production.

**Status:** DECISION / ACTIVE.

### D-007 — Documentation as persistent agent memory

**Decision:** The master project documentation is the durable project context for future AI agents.

**Status:** DECISION / ACTIVE.

**Consequence:** Agents must read it before implementation and update it when project knowledge changes.

### D-008 — Release preflight and pinned runtime dependencies

**Decision:** The v2 release path must validate the real Action before creating a versioned tag, and direct Python runtime dependencies must be pinned in `requirements.txt`.

**Status:** DECISION / ACTIVE.

**Consequence:** A release cannot be tagged if the live Action preflight fails or the requested versioned tag already exists. Runtime dependency resolution must use the repository's pinned direct dependencies.


### D-009 — GitHub Marketplace is the distribution target

**Decision:** DevLens v2 is distributed as a GitHub Marketplace Action. PyPI is not a distribution target.

**Status:** DECISION / ACTIVE.

**Consequence:** Release work must prioritize the root `action.yml`, semantic GitHub releases, the floating `v2` tag, Marketplace publication, and end-to-end installation verification. Python packages remain implementation dependencies of the Action and are not published as a separate product.

## 20. Agent handoff template

When an agent finishes meaningful work, the final handoff should contain:

**Objective**
- What the agent was asked to accomplish.

**Implemented**
- Files changed.
- Behavior changed.
- Product/architecture impact.

**Verification**
- Tests run.
- Workflow run IDs or commit SHAs when applicable.
- Any known limitations.

**Documentation**
- Which project documents were updated.
- Any new decision or roadmap change.

**Remaining**
- Blockers.
- Follow-up work.
- Unverified assumptions.

**Next agent**
- The single most useful next action.

## 21. Source-of-truth warnings

Do not trust these as current truth without verification:

- Old AI conversation summaries.
- Cached GitHub search results.
- Historical dashboard code from old commits.
- Closed pull requests describing the former architecture.
- Planned release entries in `CHANGELOG.md`.
- README score snapshots that are not generated from the current Action.
- Old Vercel deployment state.

When uncertain, inspect the current repository and current GitHub Actions state.

## 22. Current working objective

**Primary objective:** Release and establish DevLens v2 as a reliable, GitHub-native repository health Action while preserving the Action-only product boundary.

The next agent should first verify the actual release/distribution state, then work on the highest-priority unresolved item from Phase 1 rather than inventing a new product direction.
