---
status: pending
priority: p2
issue_id: "007"
tags: [code-review, security, github-actions, supply-chain]
dependencies: []
---

# Isolate workflow write permissions

## Problem Statement

The discovery job grants repository, Issue, and PR write permissions to dependency installation, tests, builds, and mutable action references. A compromised action or dependency can use the same credential intended only for publication.

## Findings

- `.github/workflows/sync-events.yml:12-23` grants three write scopes and exports the token at job scope.
- Checkout persists credentials before `pnpm install`, tests, external parsing, and build.
- Actions at lines 26, 31, and 36 use mutable version tags rather than reviewed commit SHAs.
- The schedule only runs default-branch code, reducing but not eliminating supply-chain exposure.

## Proposed Solutions

### Option 1: Split read and write jobs

**Approach:** Run discovery/validation with `contents: read`, then pass reviewed artifacts to narrowly scoped mutation jobs.

**Pros:** Strong privilege separation.
**Cons:** Requires artifact/job plumbing.
**Effort:** Medium.
**Risk:** Low.

### Option 2: Harden the single job

**Approach:** Pin actions to SHAs, disable persisted checkout credentials, and expose tokens only on exact mutation steps.

**Pros:** Smaller workflow change.
**Cons:** Job-level permissions still exist for all actions through token context.
**Effort:** Small/Medium.
**Risk:** Medium.

## Recommended Action

To be filled during triage.

## Technical Details

**Affected file:** `.github/workflows/sync-events.yml:12-100`.
**Database changes:** None.

## Resources

- **PR:** https://github.com/Jean-CS/rubra/pull/12

## Acceptance Criteria

- [ ] Install/test/build steps have read-only repository permissions.
- [ ] Write credentials are available only to the necessary mutation steps/jobs.
- [ ] Checkout credentials are not persisted through untrusted execution.
- [ ] Third-party actions are pinned to reviewed immutable SHAs.

## Work Log

### 2026-08-02 - Workflow threat model

**By:** Codex review team

**Actions:** Mapped token scope across all job steps and action references.
**Learnings:** The current publication credential is effectively a job-wide credential.
