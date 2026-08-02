---
status: ready
priority: p2
issue_id: "009"
tags: [code-review, quality, discovery]
dependencies: []
---

# Tokenize Meetup discovery keywords

## Problem Statement

The short keyword `ia` is matched as an arbitrary substring, so ordinary Portuguese group names are classified as technology and can consume the limited group budget.

## Findings

- `scripts/events/config.ts:27-42` includes `ia`.
- `scripts/events/adapters/meetup.ts:82` uses `haystack.includes(keyword)`.
- Reproduced false positives include `fotografia-londrina` and `familias-londrina`.
- Every event from a selected group is then classified as `technology`.

## Proposed Solutions

### Option 1: Token-aware matching

**Approach:** Tokenize normalized group slug/text and require exact tokens for short keywords.

**Pros:** Preserves `ia` while removing embedded-word matches.
**Cons:** Compound forms need explicit aliases.
**Effort:** Small.
**Risk:** Low.

### Option 2: Remove ambiguous short keywords

**Approach:** Replace `ia` with longer signals such as `inteligencia artificial`, `ai`, and known group aliases.

**Pros:** Simplest behavior.
**Cons:** May miss legitimate abbreviated groups.
**Effort:** Small.
**Risk:** Low.

## Recommended Action

Use Option 2: remove the ambiguous `ia` keyword and replace it with longer explicit signals and known aliases that cannot match ordinary Portuguese words by substring.

## Technical Details

**Affected files:** `scripts/events/config.ts`, `scripts/events/adapters/meetup.ts`, `tests/events/meetup.test.ts`.
**Database changes:** None.

## Resources

- **PR:** https://github.com/Jean-CS/rubra/pull/12

## Acceptance Criteria

- [ ] `fotografia` and `familias` do not match the `ia` signal.
- [ ] Explicit AI/IA technology group names still match.
- [ ] Tests cover token boundaries and compound aliases.
- [ ] False positives cannot crowd out known technology groups.

## Work Log

### 2026-08-02 - Parser probe

**By:** Codex review team

**Actions:** Parsed synthetic Meetup anchors containing common Portuguese words.
**Learnings:** Two non-technology names matched solely because they contain the letters `ia`.
