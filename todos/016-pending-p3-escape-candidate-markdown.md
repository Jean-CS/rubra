---
status: pending
priority: p3
issue_id: "016"
tags: [code-review, security, github-issues]
dependencies: ["006"]
---

# Escape untrusted candidate Issue Markdown

## Problem Statement

Public event text is interpolated directly into bot-authored GitHub Markdown, allowing headings, checked boxes, tables, phishing links, and user/team mentions to appear as trusted workflow content.

## Findings

- `scripts/events/publish-candidates.ts:13-36` embeds title, description, location, organizer, ID, and URL without escaping.
- A reproduced description containing `@Jean-CS`, an approval heading, and a checked review box rendered as active Markdown.
- Injected marker-like HTML comments can also confuse substring-based deduplication.

## Proposed Solutions

### Option 1: Escape by context

**Approach:** Escape table cells, neutralize mentions, cap lengths, and render descriptions in a clearly delimited escaped block.

**Pros:** Preserves useful detail safely.
**Cons:** Requires context-specific helpers.
**Effort:** Small/Medium.
**Risk:** Low.

### Option 2: Publish a minimal candidate record

**Approach:** Include only normalized short fields and the validated source link.

**Pros:** Smallest attack and maintenance surface.
**Cons:** Reviewers must open the source for full description.
**Effort:** Small.
**Risk:** Low.

## Recommended Action

To be filled during triage.

## Technical Details

**Affected files:** `scripts/events/publish-candidates.ts:7-47`, publisher tests.
**Database changes:** None.

## Resources

- **PR:** https://github.com/Jean-CS/rubra/pull/12

## Acceptance Criteria

- [ ] Public text cannot create active mentions or fake checklist state.
- [ ] Table delimiters/newlines cannot break the intended layout.
- [ ] Deduplication recognizes only the collector-owned marker position.
- [ ] Field lengths are bounded.
- [ ] Tests cover Markdown and marker injection.

## Work Log

### 2026-08-02 - Markdown injection probe

**By:** Codex review team

**Actions:** Built a candidate Issue with mention and approval-like Markdown.
**Learnings:** Upstream text currently renders with the bot's apparent authority.
