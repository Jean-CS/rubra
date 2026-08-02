---
status: ready
priority: p3
issue_id: "014"
tags: [code-review, performance, parser]
dependencies: []
---

# Linearize Sympla event extraction

## Problem Statement

Each Sympla event marker triggers a new scan from the beginning of the serialized state, creating quadratic parsing work and retaining duplicate full object strings.

## Findings

- `scripts/events/adapters/sympla.ts:24-49` scans from index zero to find a containing object.
- `extractPayloads` calls it once per marker at lines 77-83.
- Synthetic timings grew superlinearly: about 39ms/100 events, 130ms/500, 405ms/1,000, and 1,445ms/2,000.
- Current catalogs are small enough that this is not a merge blocker.

## Proposed Solutions

### Option 1: Parse and traverse once

**Approach:** Decode the state structure and recursively collect objects with `company === "sympla"`.

**Pros:** Linear traversal and simplest semantics.
**Cons:** Depends on the decoded state remaining valid JSON.
**Effort:** Medium.
**Risk:** Low.

### Option 2: Single-pass brace scanner

**Approach:** Track object boundaries once and emit matching objects without rescanning.

**Pros:** Handles concatenated state fragments.
**Cons:** More custom parser logic.
**Effort:** Medium.
**Risk:** Medium.

## Recommended Action

Use Option 1: parse the decoded state once and traverse the resulting object graph to collect Sympla event objects in linear time.

## Technical Details

**Affected file:** `scripts/events/adapters/sympla.ts:24-95`; parser benchmarks/tests.
**Database changes:** None.

## Resources

- **PR:** https://github.com/Jean-CS/rubra/pull/12

## Acceptance Criteria

- [ ] Each serialized character/object is scanned a bounded number of times.
- [ ] Full object strings are not retained solely for deduplication.
- [ ] Existing parser fixtures remain unchanged.
- [ ] A large synthetic fixture demonstrates approximately linear scaling.

## Work Log

### 2026-08-02 - Scale benchmark

**By:** Codex review team

**Actions:** Timed synthetic catalogs from 100 to 2,000 events.
**Learnings:** Runtime growth is visibly superlinear, though current input size is modest.
