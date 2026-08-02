---
status: ready
priority: p2
issue_id: "011"
tags: [code-review, data-integrity, discovery]
dependencies: []
---

# Require source city before Sympla auto-publication

## Problem Statement

Missing Sympla location data is defaulted to Londrina, allowing an event with no verified city to pass the city filter and be treated as complete.

## Findings

- `scripts/events/adapters/sympla.ts:103-107` defaults location city to `Londrina`.
- Lines 124-140 again default the event city before the adapter filter.
- Removing city from the fixture still produced two events with fabricated `city: "Londrina"`; the online venue became `Online — Londrina, PR`.
- This contradicts the PR's guarantee that other-city or incomplete events are not automatically proposed as publishable.

## Proposed Solutions

### Option 1: Treat missing city as incomplete

**Approach:** Preserve an empty/unknown city and route the event to candidate triage.

**Pros:** No invented locality; matches stated policy.
**Cons:** More manual review for incomplete source data.
**Effort:** Small.
**Risk:** Low.

### Option 2: Use catalog locality as explicit evidence

**Approach:** Only infer Londrina if the catalog contract proves locality and encode that provenance separately.

**Pros:** Retains coverage.
**Cons:** Online/national listings still need special handling.
**Effort:** Medium.
**Risk:** Medium.

## Recommended Action

Use Option 1: preserve missing city as unknown and route the event to candidate triage instead of inferring Londrina.

## Technical Details

**Affected files:** `scripts/events/adapters/sympla.ts:103-140`, `tests/events/sympla.test.ts`.
**Database changes:** None.

## Resources

- **PR:** https://github.com/Jean-CS/rubra/pull/12

## Acceptance Criteria

- [ ] Missing source city is not silently replaced with Londrina.
- [ ] Incomplete locality cannot pass automatic publication gates.
- [ ] Online events have an explicit locality policy.
- [ ] Tests cover missing, allowed, and disallowed cities.

## Work Log

### 2026-08-02 - Missing-field reproduction

**By:** Codex

**Actions:** Removed city fields from the committed Sympla fixture and parsed it.
**Learnings:** Both results remained eligible as Londrina events.
