---
status: pending
priority: p2
issue_id: "004"
tags: [code-review, security, data-integrity]
dependencies: []
---

# Enforce organizer trust during reconciliation

## Problem Statement

Fallback matching can let an event from an unknown organizer update a trusted existing event because organizer lookup prefers the existing document's organizer over the public source's organizer.

## Findings

- `scripts/events/content.ts:216-229` may match by `title|date|city`.
- Line 218 resolves trust from `existing.data.organizerName`, not `event.organizerName`.
- A reproduced event from `Attacker Org` with a colliding title/date/city produced no candidate, retained `GDG Londrina`, and replaced the existing URL.
- Human PR review limits immediacy but does not repair the trust-boundary decision.

## Proposed Solutions

### Option 1: Require source organizer trust

**Approach:** Always resolve the registry from `event.organizerName`; send unknown organizers to triage.

**Pros:** Directly restores the stated trust rule.
**Cons:** Organizer renames need explicit handling.
**Effort:** Small.
**Risk:** Low.

### Option 2: Restrict automatic updates to stable source identity

**Approach:** Auto-update only exact provider/external-ID matches; treat URL/fallback matches as association candidates.

**Pros:** Strongest protection for editorial content.
**Cons:** More manual triage for legacy events.
**Effort:** Medium.
**Risk:** Low.

## Recommended Action

To be filled during triage.

## Technical Details

**Affected files:** `scripts/events/content.ts:96-117,216-229`, `tests/events/content.test.ts`.
**Database changes:** None.

## Resources

- **PR:** https://github.com/Jean-CS/rubra/pull/12

## Acceptance Criteria

- [ ] Unknown source organizers cannot bypass candidate triage through fallback matching.
- [ ] Automatic updates require a documented identity rule.
- [ ] A regression test covers the colliding unknown-organizer scenario.
- [ ] Manual event association remains possible through explicit review.

## Work Log

### 2026-08-02 - Security reproduction

**By:** Codex review team

**Actions:** Reconciled an attacker-owned event against a trusted fallback match.
**Learnings:** Existing editorial organizer data currently substitutes for upstream identity.
