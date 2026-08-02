---
status: ready
priority: p2
issue_id: "012"
tags: [code-review, compliance, robots, quality]
dependencies: []
---

# Honor robots.txt user-agent specificity

## Problem Statement

The custom robots parser merges every matching non-wildcard group instead of selecting the most specific user-agent group. Conflicting rules can therefore allow a path explicitly disallowed for this collector.

## Findings

- `scripts/events/robots.ts:44-55` selects all specific matching groups and flattens their rules.
- The implementation also uses substring product matching.
- Reproduced input with broader `Rubra` allowing `/private` and specific `RubraEventIndexer` disallowing it returned `true`, where the specific group should win.
- Existing tests cover only a wildcard group.

## Proposed Solutions

### Option 1: Use a maintained parser

**Approach:** Replace the custom interpreter with an RFC-aware robots parser and keep only the fail-fast wrapper.

**Pros:** Removes roughly 40-50 lines of protocol logic.
**Cons:** Adds one dependency that must be vetted.
**Effort:** Small/Medium.
**Risk:** Low.

### Option 2: Correct and expand the local parser

**Approach:** Implement longest matching product-token selection and comprehensive precedence tests.

**Pros:** No new dependency.
**Cons:** Retains standards maintenance burden.
**Effort:** Medium.
**Risk:** Medium.

## Recommended Action

Use Option 1: replace the custom robots interpreter with a vetted, maintained RFC-aware parser while keeping the project-specific fail-fast wrapper and regression tests.

## Technical Details

**Affected files:** `scripts/events/robots.ts:3-55`, `tests/events/robots.test.ts`.
**Database changes:** None.

## Resources

- **PR:** https://github.com/Jean-CS/rubra/pull/12

## Acceptance Criteria

- [ ] The most specific matching user-agent group wins.
- [ ] Wildcard groups apply only when no more specific group matches.
- [ ] Allow/disallow precedence follows the selected parser's documented behavior.
- [ ] Tests cover conflicting wildcard, prefix, and exact collector groups.

## Work Log

### 2026-08-02 - Specificity probe

**By:** Codex

**Actions:** Evaluated conflicting broad and collector-specific rules.
**Learnings:** Flattening matching groups reverses an explicit collector disallow.
