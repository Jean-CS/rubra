---
status: pending
priority: p2
issue_id: "008"
tags: [code-review, reliability, github-api, performance]
dependencies: ["002"]
---

# Make candidate publication complete and bounded

## Problem Statement

Candidate deduplication and creation stop at fixed first pages/slices. Later candidates can be starved forever, old candidates can be duplicated, and GitHub requests have no explicit timeout.

## Findings

- `scripts/events/publish-candidates.ts:86-94` loads only the newest 100 labeled Issues.
- Line 92 slices the first 20 candidates before skipping existing markers.
- With 25 candidates and markers for the first 20, the function returned `created: 0` and never examined the remaining five.
- Once more than 100 labeled Issues exist, markers on later pages are invisible.
- GitHub fetches at lines 51-76 have no timeout or bounded recovery.

## Proposed Solutions

### Option 1: Paginate, index markers, then cap creations

**Approach:** Fetch all pages into a marker set, iterate all candidates, and stop when 20 new Issues have been created.

**Pros:** Complete, deterministic, straightforward.
**Cons:** More GETs as history grows.
**Effort:** Medium.
**Risk:** Low.

### Option 2: Search markers per candidate

**Approach:** Use GitHub search/GraphQL for stable external markers and retain a per-run creation cap.

**Pros:** Avoids scanning full history.
**Cons:** Search indexing delay and API complexity.
**Effort:** Medium.
**Risk:** Medium.

## Recommended Action

To be filled during triage.

## Technical Details

**Affected files:** `scripts/events/publish-candidates.ts:49-103`, publisher tests.
**Database changes:** None.

## Resources

- **PR:** https://github.com/Jean-CS/rubra/pull/12

## Acceptance Criteria

- [ ] Existing candidates do not consume the new-Issue cap.
- [ ] Candidates after position 20 are eventually published.
- [ ] Markers beyond GitHub's first response page are detected.
- [ ] GitHub requests use explicit timeouts and bounded safe retries.
- [ ] Tests cover starvation, page-two deduplication, and timeout behavior.

## Work Log

### 2026-08-02 - Scale reproduction

**By:** Codex review team

**Actions:** Simulated an existing first batch and a larger candidate list.
**Learnings:** The cap currently limits inspection, not creation.
