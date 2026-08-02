---
status: pending
priority: p2
issue_id: "005"
tags: [code-review, security, ssrf, http]
dependencies: []
---

# Restrict HTTP redirects to safe provider destinations

## Problem Statement

`PublicHttpClient` follows redirects to arbitrary origins and protocols. A compromised provider or open redirect can make the GitHub runner request internal or link-local resources.

## Findings

- `scripts/events/http.ts:89-97` checks only block-page strings before following `Location`.
- There is no HTTPS requirement, provider-host allowlist, or private/loopback/link-local rejection.
- A reproduced redirect from a trusted HTTPS URL to `http://127.0.0.1:3000/admin` was fetched successfully.

## Proposed Solutions

### Option 1: Same-provider HTTPS redirects only

**Approach:** Pass allowed provider hostnames to the client and reject every hop outside HTTPS and that set.

**Pros:** Simple and aligned with current fixed sources.
**Cons:** Legitimate CDN/auth-domain redirects need explicit entries.
**Effort:** Small/Medium.
**Risk:** Low.

### Option 2: General SSRF guard

**Approach:** Validate schemes and resolve DNS, rejecting private, loopback, link-local, multicast, and reserved addresses on every hop.

**Pros:** Reusable and defense-in-depth.
**Cons:** More implementation and DNS-rebinding care.
**Effort:** Medium.
**Risk:** Medium.

## Recommended Action

To be filled during triage.

## Technical Details

**Affected files:** `scripts/events/http.ts:65-109`, adapter construction, `tests/events/http.test.ts`.
**Database changes:** None.

## Resources

- **PR:** https://github.com/Jean-CS/rubra/pull/12

## Acceptance Criteria

- [ ] Redirects to HTTP, loopback, private, and link-local targets are rejected.
- [ ] Cross-provider redirects are rejected unless explicitly allowed.
- [ ] Final response URLs are validated as well as `Location` headers.
- [ ] Tests cover safe and unsafe redirect chains.

## Work Log

### 2026-08-02 - SSRF probe

**By:** Codex review team

**Actions:** Supplied a mocked loopback redirect and observed the second fetch.
**Learnings:** The method name promises safe redirects, but destination safety is not enforced.
