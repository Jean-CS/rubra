---
status: ready
priority: p2
issue_id: "006"
tags: [code-review, security, xss, validation]
dependencies: []
---

# Restrict event links to HTTP and HTTPS

## Problem Statement

Discovered event URLs accept any WHATWG URL scheme and are rendered into clickable anchors. Malformed upstream data can therefore produce `javascript:`, `data:`, or `file:` links in publishable content.

## Findings

- `scripts/events/text.ts:48-54` preserves non-HTTP schemes.
- Both adapters pass upstream URLs through that helper.
- `src/content.config.ts:95` uses `z.string().url()`, which also accepts those schemes.
- Local probes confirmed `canonicalUrl` and the schema accept `javascript:`, `data:`, and `file:`.
- Links render at `src/pages/eventos.astro:136,200` and on the home page.

## Proposed Solutions

### Option 1: Shared HTTP(S)-only validator

**Approach:** Require `https:` or `http:` in a shared URL parser and Zod refinement.

**Pros:** Consistent defense across ingestion and content.
**Cons:** Requires wiring one shared contract.
**Effort:** Small.
**Risk:** Low.

### Option 2: Provider-specific URL validation

**Approach:** Additionally require Sympla/Meetup hostnames for automated sources.

**Pros:** Strongest provenance control.
**Cons:** Must account for documented canonical domains.
**Effort:** Small/Medium.
**Risk:** Low.

## Recommended Action

Use Option 1: introduce a shared HTTP(S)-only URL validator and apply it consistently during canonicalization and Astro content validation.

## Technical Details

**Affected files:** `scripts/events/text.ts`, both adapters, `src/content.config.ts`, parser/schema tests.
**Database changes:** None.

## Resources

- **PR:** https://github.com/Jean-CS/rubra/pull/12

## Acceptance Criteria

- [ ] Content validation rejects non-HTTP(S) event and source URLs.
- [ ] Automated adapters reject unexpected provider hosts.
- [ ] Tests cover `javascript:`, `data:`, `file:`, and valid HTTPS URLs.
- [ ] Existing valid event content still builds.

## Work Log

### 2026-08-02 - Scheme validation probe

**By:** Codex review team

**Actions:** Evaluated canonicalization and Zod validation for unsafe schemes.
**Learnings:** Generic URL validity is not equivalent to safe navigational URL validity.
