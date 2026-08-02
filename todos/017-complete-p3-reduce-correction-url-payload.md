---
status: complete
priority: p3
issue_id: "017"
tags: [code-review, performance, frontend]
dependencies: []
---

# Reduce correction-link URL payload

## Problem Statement

Every event card embeds the complete event record in a GitHub Issue Form URL. This inflates generated HTML and can exceed URL limits for long editorial content.

## Findings

- `src/lib/eventIssues.ts:24-42` serializes description, tags, location, organizer, and other fields into query parameters.
- The links render for every archive event in `src/pages/eventos.astro` and upcoming events on the home page.
- Current generated correction URLs total roughly 28,418 characters across 32 event files, averaging about 888 characters per event.
- Description and tags have no relevant upper bound for URL construction.

## Proposed Solutions

### Option 1: Prefill only stable identity

**Approach:** Send template, title, event ID, and a short evidence prompt; let reviewers resolve current Markdown by ID.

**Pros:** Major HTML reduction and avoids URL-length failures.
**Cons:** Less prefilled convenience.
**Effort:** Small.
**Risk:** Low.

### Option 2: Keep full prefill with limits

**Approach:** Cap each field and the final URL, falling back to identity-only links.

**Pros:** Preserves convenience for ordinary events.
**Cons:** More branching and duplicated data remains.
**Effort:** Small/Medium.
**Risk:** Low.

## Recommended Action

Use Option 1: prefill only the Issue template, correction title, stable event ID, and a short evidence prompt. Reviewers will resolve the current record from the event ID.

## Technical Details

**Affected files:** `src/lib/eventIssues.ts`, callers/tests for correction links.
**Database changes:** None.

## Resources

- **GitHub URL query documentation:** https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-an-issue
- **PR:** https://github.com/Jean-CS/rubra/pull/12

## Acceptance Criteria

- [x] Correction links remain below a documented maximum length.
- [x] Every link still identifies the exact event.
- [x] Archive HTML does not scale with duplicated full descriptions.
- [x] A test covers a long manual event description.

## Work Log

### 2026-08-02 - Static payload measurement

**By:** Codex review team

**Actions:** Counted generated correction URL characters for current event content.
**Learnings:** Full-record prefilling duplicates substantial content into static markup.

### 2026-08-02 - Identity-only correction links

**By:** Codex

**Actions:**
- Reduced `CorrectableEvent` to stable `id` and `title`.
- Limited correction query parameters to `template`, `title`, `event-reference`, and `evidence`.
- Added `tests/events/event-issues.test.ts` with a large source object and a 600-character URL ceiling.
- Ran 17 event tests, TypeScript checking, the 52-page Astro build, and `git diff --check`.

**Learnings:**
- Structural typing lets existing collection records call the narrower helper without caller changes.
- Full descriptions and tags no longer affect generated correction-link size.
