---
title: "feat: Add calibrated event triage suggestions"
type: feat
status: completed
date: 2026-08-06
origin: docs/brainstorms/2026-08-06-event-triage-calibration-brainstorm.md
---

# Add calibrated event triage suggestions

## Overview

Extend PR #12's candidate pipeline with deterministic, explainable triage suggestions while preserving mandatory human review. Every new discovery candidate continues to create an Issue during calibration and receives exactly one `triagem:` label.

## Proposed Solution

- Add a versioned classifier that returns `obvious-no`, `review`, or `technology` plus human-readable reasons.
- Preserve the existing source classification used by reconciliation; triage suggestions only affect candidate Issues.
- Add a stable editorial override for Health Connect Summit 2026.
- Ensure all three GitHub labels exist before publishing candidates.
- Display the suggestion and escaped reasons in the Issue body.
- Document calibration and its exit criterion.

## Flow and Edge Cases

1. A discovered event that requires triage is classified locally before candidates are serialized.
2. The publisher creates missing constant labels and applies one suggestion label to each new Issue.
3. Exact editorial overrides take precedence, strong non-tech rules precede adjacent review rules, and adjacent-sector rules precede catalog-based technology confidence.
4. Existing Issue markers remain deduplicated across open and closed states and are not relabeled automatically.
5. Untrusted source text can only influence a fixed category; it cannot create arbitrary labels and all displayed reasons remain escaped.
6. Missing-label or Issue-creation API failures continue to fail the workflow visibly, preserving the current retry and operational behavior.

## Acceptance Criteria

- [x] Every serialized candidate includes one triage suggestion and at least one reason.
- [x] Every newly created candidate Issue has exactly one of `triagem:obvio-nao`, `triagem:revisar`, or `triagem:tecnologia`.
- [x] Calibration does not close, suppress, or publish candidates automatically.
- [x] Health Connect Summit is suggested as technology.
- [x] The ten curated obvious-no Issues are covered by regression tests.
- [x] Construtech Week and Similar Tech Experience are covered as review cases.
- [x] A direct GDG/software-style event is covered as technology.
- [x] Existing deduplication and the 20-Issue creation cap remain intact.
- [x] README and CONTRIBUTING describe labels, human decisions, and the 14-run/20-suggestion exit criterion.
- [x] `pnpm check`, `pnpm test`, `pnpm build`, and `git diff --check` pass.

## Risks and Boundaries

- Rules operate on the public catalog metadata already collected by PR #12; individual event pages remain out of scope.
- False suggestions are expected during calibration and must not change publication state.
- Historical Issues are intentionally not backfilled in this change.
- An LLM classifier and automatic suppression are explicitly deferred.

## Post-Deploy Monitoring & Validation

- Review the first 14 daily workflow runs and all Issues carrying `triagem:` labels.
- Healthy behavior: every new candidate has one suggested label and a readable reason; no candidate is closed automatically.
- Failure signals: missing labels, conflicting suggestion labels, a false `obvio-nao`, or fewer Issues than discovered candidates without an existing marker.
- Mitigation: revert the classifier change or narrow the matching rule; keep all candidates in human review.
- Owner: repository maintainer performing event curation.

## Sources

- [Origin brainstorm](../brainstorms/2026-08-06-event-triage-calibration-brainstorm.md)
- PR #12 event-discovery pipeline
- Curated Issues #16, #17, and #20–#30
