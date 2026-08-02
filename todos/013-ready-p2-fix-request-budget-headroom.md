---
status: ready
priority: p2
issue_id: "013"
tags: [code-review, reliability, performance, http]
dependencies: []
---

# Give the request budget retry headroom

## Problem Statement

The configured sources require up to 18 physical requests in the happy path, but the global cap is 20 and counts redirects/retries. Two ordinary extra hops can exhaust the budget and make the advertised retry policy ineffective.

## Findings

- `scripts/events/config.ts:9-26` configures 3 Sympla catalogs and up to 12 Meetup groups.
- Nominal maximum: Sympla robots + catalogs = 4; Meetup robots + discovery + groups = 14; total = 18.
- `scripts/events/http.ts:54-82` counts every attempt and redirect against the same global ceiling.
- Both adapters share that counter concurrently at `scripts/events/sync.ts:37-38`.
- One source can consume the remaining headroom before the other completes, aborting the all-or-nothing run.

## Proposed Solutions

### Option 1: Separate logical and physical budgets

**Approach:** Cap logical source URLs while keeping a larger physical safety ceiling sized for redirects/retries.

**Pros:** Retry policy works as configured.
**Cons:** Two counters to observe.
**Effort:** Small/Medium.
**Risk:** Low.

### Option 2: Reserve per-adapter budgets

**Approach:** Give each provider its own request allocation and explicit hop ceiling.

**Pros:** One source cannot starve the other.
**Cons:** More configuration.
**Effort:** Medium.
**Risk:** Low.

## Recommended Action

Use Option 2: allocate explicit per-adapter request budgets with bounded redirect/retry hops so neither provider can starve the other.

## Technical Details

**Affected files:** `scripts/events/config.ts`, `scripts/events/http.ts`, `scripts/events/sync.ts`, HTTP/adapter tests.
**Database changes:** None.

## Resources

- **PR:** https://github.com/Jean-CS/rubra/pull/12

## Acceptance Criteria

- [ ] All configured logical URLs can use the declared retry policy.
- [ ] Redirect loops remain strictly bounded.
- [ ] One adapter cannot exhaust another's reserved budget.
- [ ] Logs distinguish logical requests from physical attempts.
- [ ] Tests cover maximum groups plus redirects/retries.

## Work Log

### 2026-08-02 - Budget calculation

**By:** Codex review team

**Actions:** Counted configured happy-path calls and compared them with the client counter.
**Learnings:** Only two physical requests remain for all retry and redirect behavior.
