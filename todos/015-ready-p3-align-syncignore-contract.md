---
status: ready
priority: p3
issue_id: "015"
tags: [code-review, simplicity, typescript, quality]
dependencies: []
---

# Align the syncIgnore contract with synchronized fields

## Problem Statement

The allowed `syncIgnore` fields are duplicated and already drift semantically: `tags` is documented and accepted, but tags are never updated during reconciliation, so ignoring them has no effect.

## Findings

- `scripts/events/content.ts:7-19` declares `SYNCABLE_FIELDS`.
- `src/content.config.ts:15-27` manually duplicates the list.
- `scripts/events/content.ts:163-174` omits `tags` from `nextValues`.
- README/CONTRIBUTING present `tags` as a meaningful protection.

## Proposed Solutions

### Option 1: Share the tuple and synchronize tags

**Approach:** Export one schema-safe constant and include tags in reconciliation.

**Pros:** Contract and behavior align.
**Cons:** Source tag changes begin affecting content.
**Effort:** Small.
**Risk:** Medium.

### Option 2: Remove tags from the contract

**Approach:** Stop documenting/validating `tags` until tag synchronization is intentionally implemented.

**Pros:** Minimal and honest behavior.
**Cons:** Does not provide tag synchronization.
**Effort:** Small.
**Risk:** Low.

## Recommended Action

Use Option 2: remove `tags` from the accepted and documented `syncIgnore` contract until tag synchronization is intentionally implemented.

## Technical Details

**Affected files:** `scripts/events/content.ts`, `src/content.config.ts`, README/CONTRIBUTING, reconciliation tests.
**Database changes:** None.

## Resources

- **PR:** https://github.com/Jean-CS/rubra/pull/12

## Acceptance Criteria

- [ ] The accepted `syncIgnore` values come from one source of truth or a tested synchronization rule.
- [ ] Every accepted field has defined synchronization behavior.
- [ ] Documentation matches runtime behavior.
- [ ] Tests demonstrate whether tags update and whether `syncIgnore: [tags]` protects them.

## Work Log

### 2026-08-02 - Simplicity review

**By:** Codex review team

**Actions:** Compared schema, runtime tuple, update map, and documentation.
**Learnings:** The duplicated contract has already drifted.
