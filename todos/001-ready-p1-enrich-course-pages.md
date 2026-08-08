---
status: complete
priority: p1
issue_id: "001"
tags: [astro, seo, content, courses]
dependencies: []
---

# Enrich course pages with verified decision data

## Problem Statement

Course pages expose useful basic facts but do not distinguish verified, estimated, unavailable, and not-applicable data. They also lack structured admissions, curriculum, source freshness, multi-shift support, and comparable courses across institutions.

## Findings

- Rubra has 38 course records validated by `src/content.config.ts`.
- Shift, workload, description, tags, and a URL are nearly complete.
- Most URLs are generic institution pages rather than course-specific sources.
- `src/content/institutions/_missing_data.md` records estimates and uncertainty that the UI does not expose.
- Related courses currently come only from the same institution.
- The Astro static build makes a coordinated schema/content migration safe and testable.

## Proposed Solutions

### Option 1: Add more prose only

**Approach:** Expand each course description without changing the data model.

**Pros:** Small template change.

**Cons:** Does not solve provenance, comparison, freshness, or structured reuse.

**Effort:** Medium

**Risk:** Medium

### Option 2: Structured enrichment with explicit uncertainty

**Approach:** Extend the content schema, migrate records, render decision sections, improve related-course selection, update contribution inputs, and backfill verified content in cohorts.

**Pros:** Trustworthy, reusable for future comparison pages, and useful without filler copy.

**Cons:** Coordinated migration across all course records.

**Effort:** High

**Risk:** Medium

## Recommended Action

Implement Option 2. Keep enrichment fields optional during rollout, preserve all public URLs, and never turn missing or estimated information into asserted facts.

## Technical Details

**Affected files:**

- `src/content.config.ts`
- `src/lib/courses.ts`
- `src/pages/instituicoes/[id]/[courseId].astro`
- `src/content/institutions/*/*.md`
- `src/content/institutions/_missing_data.md`
- `.github/ISSUE_TEMPLATE/atualizar-curso.yml`
- `tests/courses/content.test.ts`

**Database changes:** None. Content remains build-time Markdown validated with Zod.

## Resources

- `docs/plans/2026-08-08-001-feat-enrich-course-pages-plan.md`
- Original course implementation: commit `fd23f9d` / PR #7

## Acceptance Criteria

- [x] Extend and test the course content contract.
- [x] Migrate all existing course records without changing public URLs.
- [x] Render decision-oriented sections and explicit provenance states.
- [x] Select relevant courses across institutions deterministically.
- [x] Update the course correction workflow.
- [x] Backfill the initial high-priority course cohort with verified data.
- [x] Pass `pnpm check`, `pnpm test`, and `pnpm build`.
- [x] Perform browser-level visual and accessibility verification.

## Work Log

### 2026-08-08 - Implementation started

**By:** Codex

**Actions:**

- Reviewed the implementation plan and current course content architecture.
- Confirmed user approval to proceed.
- Created `jean/course-decision-pages` from the updated `origin/main`.

**Learnings:**

- The existing missing-data ledger must be integrated into visible provenance rather than discarded.
- New fields should remain optional until authoritative source coverage improves.

## Notes

- Do not stamp verification dates from build time or git metadata.
- Exact tuition and admission claims require reliable, dated evidence.

### 2026-08-08 - Implementation complete

**By:** Codex

**Actions:**

- Migrated all 38 records to normalized areas, multiple shifts, structured tuition/MEC states, and visible verification metadata.
- Backfilled the six ADS records with official sources, admissions and curriculum details, preserving partial status where a claim still lacks authoritative confirmation.
- Rebuilt the course detail page around decision facts, provenance, explicit estimates and cross-institution related courses.
- Updated the GitHub correction form and contributor guidance.
- Verified the enriched and partial layouts at desktop and mobile widths.

**Validation:**

- `pnpm test`
- `pnpm check`
- `pnpm build`
