---
date: 2026-08-06
topic: event-triage-calibration
---

# Event triage calibration

## What We're Building

Add a deterministic, conservative triage suggestion to every event-discovery candidate produced by PR #12. During calibration, every candidate still opens a GitHub Issue and a human remains responsible for the final editorial decision.

The suggested labels are `triagem:obvio-nao`, `triagem:revisar`, and `triagem:tecnologia`. The Issue must explain which versioned rules produced the suggestion so mistakes can be corrected and turned into regression tests.

## Why This Approach

PR #12 intentionally keeps publishing decisions human. A local policy engine preserves that boundary, adds no service, token, cost, or nondeterministic dependency, and can be tested against the decisions already made in Issues #16, #17, and #20–#30. An LLM-only classifier is deferred because the collector currently has thin metadata and should not depend on an external model to decide what enters the editorial pipeline.

## Key Decisions

- Use three suggestions rather than a binary decision: direct technology, obvious non-technology, and human review.
- Calibration never auto-closes, suppresses, or publishes an event.
- `Health Connect Summit 2026` is an explicit technology exception despite its health-sector context.
- Medical, legal, food-service, generic commercial, and similarly direct non-tech signals can suggest `obvio-nao`.
- Vertical or adjacent technology such as Construtech and industrial automation suggests `revisar`.
- Direct practitioner topics such as software, programming, cloud, data, cybersecurity, AI, and hackathons can suggest `tecnologia` when an adjacent-sector rule does not take precedence.
- The calibration exit criterion is at least 14 daily runs and at least 20 `obvio-nao` suggestions with zero false rejections.
- Existing closed Issues are regression examples; the first implementation does not mutate or relabel historical Issues.

## Open Questions

None. The user approved the labels, calibration behavior, and exit criterion.

## Next Steps

Implement the plan in `docs/plans/2026-08-06-001-feat-event-triage-calibration-plan.md`.
