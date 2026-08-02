---
status: ready
priority: p1
issue_id: "002"
tags: [code-review, github-actions, reliability]
dependencies: []
---

# Export the token expected by candidate publishing

## Problem Statement

The daily workflow exports `GH_TOKEN`, while the candidate publisher reads only `GITHUB_TOKEN`. Every scheduled run therefore skips candidate Issue creation while reporting success, disabling a core discovery path.

## Findings

- `.github/workflows/sync-events.yml:21-23` defines only `GH_TOKEN`.
- `scripts/events/publish-candidates.ts:108-113` checks only `process.env.GITHUB_TOKEN` and treats absence as a non-error.
- GitHub Actions does not automatically expose `${{ github.token }}` to a run step under the `GITHUB_TOKEN` environment name.

## Proposed Solutions

### Option 1: Export both command-specific variables

**Approach:** Set `GITHUB_TOKEN` for the publisher step and `GH_TOKEN` only for the `gh` step.

**Pros:** Least privilege by step; explicit contract.
**Cons:** Two environment bindings.
**Effort:** Small.
**Risk:** Low.

### Option 2: Accept either token name

**Approach:** Read `GITHUB_TOKEN ?? GH_TOKEN` and fail when running in Actions without either.

**Pros:** More ergonomic locally.
**Cons:** Keeps token naming ambiguous.
**Effort:** Small.
**Risk:** Low.

## Recommended Action

Standardize exclusively on `GITHUB_TOKEN`: export that name from the workflow, read that name in the publisher, and use it for the GitHub CLI steps. Do not retain a `GH_TOKEN` alias. Missing credentials in Actions must fail loudly.

## Technical Details

**Affected files:** `.github/workflows/sync-events.yml`, `scripts/events/publish-candidates.ts`, publisher tests.
**Database changes:** None.

## Resources

- **PR:** https://github.com/Jean-CS/rubra/pull/12

## Acceptance Criteria

- [ ] A workflow-like environment successfully reaches `publishCandidates`.
- [ ] Missing credentials in Actions fail loudly instead of silently skipping.
- [ ] `gh` commands and candidate publication both receive only the token they need.
- [ ] Tests cover token-name and missing-token behavior.

## Work Log

### 2026-08-02 - Code review discovery

**By:** Codex

**Actions:** Compared workflow environment names with the publisher entrypoint.
**Learnings:** The current names do not intersect, so candidate publishing is unreachable in Actions.
