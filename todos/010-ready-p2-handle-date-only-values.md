---
status: ready
priority: p2
issue_id: "010"
tags: [code-review, dates, data-integrity]
dependencies: []
---

# Handle date-only source values without timezone drift

## Problem Statement

Date-only ISO values are parsed as UTC instants and then converted to São Paulo time, moving an all-day event to the previous calendar day and inventing a 21h start time.

## Findings

- `scripts/events/text.ts:25-45` always constructs `new Date(isoDate)` and formats it in `America/Sao_Paulo`.
- The probe `toLocalDateParts("2026-09-10", "America/Sao_Paulo")` returned `{ date: "2026-09-09", time: "21h" }`.
- Meetup consumes Schema.org `startDate`, whose declared range includes both `Date` and `DateTime`.

## Proposed Solutions

### Option 1: Branch on ISO date-only syntax

**Approach:** Preserve `YYYY-MM-DD` verbatim and omit time; use timezone conversion only for DateTime values.

**Pros:** Correct and small.
**Cons:** Requires clear handling for other partial ISO forms.
**Effort:** Small.
**Risk:** Low.

### Option 2: Return a discriminated date result

**Approach:** Distinguish all-day and timed source values in the parser type.

**Pros:** Makes absence of time explicit throughout adapters.
**Cons:** Larger refactor.
**Effort:** Medium.
**Risk:** Low.

## Recommended Action

Use Option 1: detect `YYYY-MM-DD` values, preserve the calendar date verbatim, omit time, and reserve timezone conversion for DateTime values.

## Technical Details

**Affected files:** `scripts/events/text.ts:25-45`, both adapters, date/parser tests.
**Database changes:** None.

## Resources

- **Schema.org startDate:** https://schema.org/startDate
- **PR:** https://github.com/Jean-CS/rubra/pull/12

## Acceptance Criteria

- [ ] Date-only values preserve their calendar date.
- [ ] Date-only values do not invent a time.
- [ ] Offset and UTC DateTime values still convert to São Paulo correctly.
- [ ] Tests cover all-day, offset, UTC, and invalid values.

## Work Log

### 2026-08-02 - Date edge-case probe

**By:** Codex

**Actions:** Called the shared parser with a valid Schema.org Date value.
**Learnings:** JavaScript interprets the value at UTC midnight before regional formatting.
