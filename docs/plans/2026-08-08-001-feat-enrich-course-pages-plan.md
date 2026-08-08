---
title: "feat: Enrich course pages with verified decision data"
type: feat
status: active
date: 2026-08-08
---

# Enrich course pages with verified decision data

## Overview

Turn Rubra's course detail pages from compact catalog entries into trustworthy decision pages. Preserve the existing course URLs, visual language, and static Astro architecture while adding structured delivery, admissions, curriculum, provenance, freshness, and comparable-course information.

The implementation should not chase a target word count. It should help a prospective student answer: what the course is, where and how it is delivered, when they can attend, what it costs, how to enter, what they will study, how current the information is, and which local alternatives exist.

## Current State

Rubra has 38 course records under `src/content/institutions/*/*.md` and a Zod-backed `courses` collection in `src/content.config.ts`.

Current coverage:

| Field | Coverage |
|---|---:|
| `name`, `level`, `description`, `url`, `shift`, `tags` | 38/38 |
| `workload` | 37/38 |
| `tuition` | 17/38 |
| `mec_grade` | 9/38 |
| `duration` | 1/38 |
| `modality` | 0/38 |
| campus/location, admissions, curriculum, verification date | 0/38 |

The current page template already renders optional badges and related cards, but:

- most course descriptions are only 13–20 words;
- 37 of 38 course URLs point to a general institution or campus page rather than a course-specific page;
- related courses are selected only from the same institution;
- `shift` supports only one value even when a course has multiple verified shifts;
- `src/content/institutions/_missing_data.md` records estimates and not-applicable states that are not visible on course pages.

## Key Decisions

1. **Keep existing public URLs.** Continue using `/instituicoes/{institution}/{course}` so indexed URLs and internal links do not change.
2. **Prefer structured facts to filler copy.** Add short decision-oriented sections rather than generic SEO prose.
3. **Represent uncertainty explicitly.** Distinguish missing, not published, not applicable, not yet rated, and estimated values.
4. **Do not block incremental backfills.** New enrichment fields remain optional initially; tighten requirements only after coverage is high.
5. **Separate course URLs from institution URLs.** A generic institution homepage must not be presented as the official course page or application link.
6. **Use one primary course area.** A normalized area supports related courses and future `/cursos/` comparison pages more reliably than free-form tags.
7. **Do not manufacture freshness.** `reviewedAt` records an actual editorial review, not a deployment or build date.

## Proposed Content Contract

Update the course schema in `src/content.config.ts` toward this shape:

```yaml
name: Análise e Desenvolvimento de Sistemas
level: Tecnólogo
area: software-development
description: Formação superior voltada a...

officialUrl: https://instituicao.br/curso/ads
modality: Presencial
shifts:
  - Manhã
duration: 3 anos
workload: 2.080h
campus: Campus Londrina

tuition:
  type: free

admission:
  summary: Ingresso pelo processo seletivo da instituição.
  url: https://instituicao.br/processo-seletivo

curriculumHighlights:
  - Programação e estruturas de dados
  - Engenharia de software
  - Banco de dados
  - Projeto integrador

mec:
  status: rated
  grade: 4

sources:
  - label: Página oficial do curso
    url: https://instituicao.br/curso/ads
  - label: Projeto pedagógico
    url: https://instituicao.br/curso/ads/ppc.pdf

verification:
  reviewedAt: 2026-08-01
  status: verified
  estimatedFields: []

tags:
  - ADS
  - Programação
  - Sistemas
```

### Field rules

- `area`: an enum such as `software-development`, `computer-science`, `data-ai`, `cybersecurity`, `infrastructure`, `engineering`, `design`, and `digital-marketing`.
- `officialUrl`: optional and course-specific. If absent, render the parent institution website separately as **Site da instituição**.
- `shifts`: replaces the singular `shift` with a non-empty array.
- `tuition.type`: `free`, `paid`, `mixed`, or `not-published`. Missing tuition means not researched; `not-published` means researched but unavailable.
- `tuition.amount`: optional and only used with a dated reliable source.
- `mec.status`: `rated`, `not-applicable`, `not-yet-rated`, or `not-found`. Require `grade` only for `rated`.
- `curriculumHighlights`: three to six concise items derived from an official curriculum or program description.
- `sources`: source links used for the visible facts; do not require all sources to be course pages because official PDFs and institutional reports may be authoritative.
- `verification.reviewedAt`: date of the last real editorial review.
- `verification.status`: `verified` or `partial`.
- `verification.estimatedFields`: known estimates carried forward from `_missing_data.md`; these must be labeled in the UI.

Use Zod refinements for discriminated states, including:

- MEC grade is present only when status is `rated`;
- tuition amount is absent for `free`;
- EAD courses do not require a physical campus;
- `curriculumHighlights`, `sources`, and `shifts` cannot be empty when present;
- estimated field names come from a controlled enum.

## Implementation Phases

### Phase 1: Content model and migration

Files:

- `src/content.config.ts`
- `src/content/institutions/*/*.md`
- `src/content/institutions/_missing_data.md`
- new `src/lib/courses.ts`
- new `tests/courses/content.test.ts`

Tasks:

- Add shared course enums and formatting helpers in `src/lib/courses.ts` rather than embedding logic in the Astro template.
- Extend the Zod schema with the proposed optional enrichment fields.
- Migrate all 38 singular `shift` values to `shifts` arrays.
- Replace `url` with `officialUrl`; retain only course-specific URLs. Generic institution URLs remain available through the parent institution record.
- Convert `tuition` and `mec_grade` into explicit structured states without inventing missing values.
- Map every course to one normalized `area`.
- Move known estimates and not-applicable states from `_missing_data.md` into each record's structured verification/MEC/tuition data.
- Keep unresolved research tasks in `_missing_data.md`; remove entries only when their state is now represented accurately in content.
- Do not mark records reviewed on 2026-08-08 unless their sources are actually rechecked that day.

### Phase 2: Course detail template

File:

- `src/pages/instituicoes/[id]/[courseId].astro`

Render these sections only when supported by data:

1. **At a glance** — level, modality, shifts, duration, workload, tuition, campus, and MEC state.
2. **Como ingressar** — admission summary and official selection link.
3. **O que você vai estudar** — curriculum highlights.
4. **Fontes e atualização** — source list, reviewed date, verification status, and visible estimate warnings.
5. **Cursos semelhantes em Londrina** — same-area courses, preferring other institutions.
6. **Correction action** — retain the existing prefilled GitHub issue flow.

Behavioral details:

- Change the primary external CTA to **Ver página oficial do curso** only when `officialUrl` exists.
- Otherwise show **Visitar site da instituição** and do not imply it is an application page.
- Do not render empty headings or placeholder prose on partially enriched records.
- Label estimated fields next to the affected value, not only in a footer disclaimer.
- Render MEC states in words; do not show an empty rating when a course is not applicable or too new.
- Preserve semantic heading order, mobile behavior, existing canonical URLs, and existing visual tokens.

### Phase 3: Related-course selection

Files:

- `src/lib/courses.ts`
- `src/pages/instituicoes/[id]/[courseId].astro`
- `tests/courses/content.test.ts`

Replace same-institution sibling selection with a pure helper that:

1. excludes the current course;
2. selects courses in the same normalized `area`;
3. prefers other institutions;
4. then prefers the same level family;
5. uses stable name/ID ordering as a deterministic tie-breaker;
6. returns at most four courses.

The existing **Outros cursos em {institution}** link may remain as a separate secondary navigation link.

### Phase 4: Contribution workflow

Files:

- `.github/ISSUE_TEMPLATE/atualizar-curso.yml`
- `src/pages/instituicoes/[id]/[courseId].astro`
- `README.md`

Update the issue form to collect:

- modality and shifts;
- duration/workload;
- campus;
- tuition state and source date;
- admission summary/link;
- curriculum highlights;
- course-specific official URL;
- supporting sources and what each correction affects.

Continue requiring manual curation. User-submitted prices, MEC grades, and admissions claims must not be published without a reliable source.

### Phase 5: Content backfill

Backfill in cohorts so each batch is reviewable:

1. Six ADS courses.
2. Four undergraduate Ciência da Computação courses.
3. Data Science and AI courses.
4. Engineering and technical courses.
5. Remaining long-tail programs.

For each cohort:

- prefer official course pages, PPC/curriculum documents, official admissions pages, and official MEC/INEP sources;
- preserve a visible `partial` status when authoritative information is unavailable;
- never infer modality, duration, campus, tuition, or admission rules from a generic institution profile;
- verify external links and record the actual review date;
- run the complete validation suite before merging.

## System-Wide Impact

- **Build lifecycle:** Astro content validation runs before static route generation. Schema changes and content migrations must land together or the build will fail.
- **Pages:** institution detail and index pages read course fields but should continue working because they primarily use name, level, and description.
- **Internal links:** public paths remain unchanged. The sitemap will continue to list the same course URLs.
- **Contribution flow:** prefilled issue URLs must use IDs that still exist in the updated issue template.
- **Future comparison pages:** `area`, structured tuition, modality, and shifts become reusable inputs for `/cursos/` pages without scraping rendered HTML.

## Risks and Mitigations

- **Stale tuition:** show exact values only with a reliable source and real review date; otherwise show the payment type or `not-published`.
- **False freshness:** never populate `reviewedAt` mechanically from git or build timestamps.
- **Estimated facts appearing authoritative:** migrate every estimate recorded in `_missing_data.md` to `estimatedFields` before exposing verification status.
- **Source pages blocked or removed:** preserve multiple authoritative sources when possible and treat inaccessible evidence as partial, not verified.
- **Overrelated courses:** use a controlled area taxonomy and deterministic selection rather than fuzzy tag overlap.
- **Big-bang content research:** keep enrichment optional and backfill by course family in separate PRs.
- **Missing vs not applicable:** encode explicit states instead of leaving ambiguous blank fields.

## Acceptance Criteria

- [x] All existing course URLs remain unchanged and return successful pages.
- [x] All 38 course records pass the updated Zod schema.
- [x] Multiple shifts can be represented without discarding verified information.
- [x] Generic institution URLs are no longer labeled as course/application pages.
- [x] Tuition and MEC values distinguish missing, unavailable, not applicable, and verified states.
- [x] Known estimates are visibly labeled on the affected values.
- [x] Fully enriched records render admissions, curriculum, sources, and reviewed date.
- [x] Partially enriched records render cleanly without empty sections.
- [x] Similar courses include relevant options from other institutions and never include the current course.
- [x] The update-course issue form captures the new facts and evidence.
- [x] `pnpm check`, `pnpm test`, and `pnpm build` pass.
- [x] Tests cover complete, partial, EAD/no-campus, multiple-shift, paid/free/mixed tuition, all MEC states, stale links, and deterministic related-course ordering.

## Success Metrics

- First cohort has course-specific official sources and visible review dates.
- No displayed estimate is presented without an estimate label.
- A visitor can determine delivery, schedule, cost state, admissions path, curriculum focus, and local alternatives without returning immediately to search.
- The new structured fields can power future course comparison pages without additional parsing or schema redesign.

## Relevant Repository References

- `src/content.config.ts` — current course schema.
- `src/pages/instituicoes/[id]/[courseId].astro` — course detail rendering and related-course selection.
- `src/content/institutions/_missing_data.md` — unresolved and estimated fact ledger.
- `.github/ISSUE_TEMPLATE/atualizar-curso.yml` — community correction workflow.
- Commit `fd23f9d` / PR #7 — original course collection and detail-page implementation.
