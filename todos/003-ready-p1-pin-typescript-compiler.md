---
status: ready
priority: p1
issue_id: "003"
tags: [code-review, typescript, ci]
dependencies: []
---

# Add a project-local TypeScript compiler

## Problem Statement

The PR adds `pnpm check` and makes it mandatory in the scheduled workflow, but `typescript` is not a dependency. A clean runner has no `tsc`, so the workflow stops before discovery.

## Findings

- `package.json:16` runs `tsc --noEmit`.
- `package.json:24-27` declares `@types/node` and `tsx`, but not `typescript`.
- `node_modules/.bin/tsc` is absent; with global binaries removed from `PATH`, `npm run check` exits 127 with `tsc: command not found`.
- The typecheck only succeeds on this workstation because a global compiler is installed.

## Proposed Solutions

### Option 1: Add TypeScript to devDependencies

**Approach:** Pin a compatible `typescript` version and update the lockfile.

**Pros:** Reproducible compiler and CI behavior.
**Cons:** Adds the expected development dependency.
**Effort:** Small.
**Risk:** Low.

### Option 2: Use Astro's supported checker

**Approach:** Add and invoke the Astro checker if template diagnostics are also desired.

**Pros:** Can cover Astro templates in addition to scripts.
**Cons:** Larger change and dependency surface.
**Effort:** Small/Medium.
**Risk:** Low.

## Recommended Action

Use Option 1: add a compatible pinned `typescript` version to `devDependencies`, update the lockfile, and verify `pnpm check` in an environment without global packages.

## Technical Details

**Affected files:** `package.json`, `pnpm-lock.yaml`, `.github/workflows/sync-events.yml`.
**Database changes:** None.

## Resources

- **PR:** https://github.com/Jean-CS/rubra/pull/12

## Acceptance Criteria

- [ ] A clean `pnpm install --frozen-lockfile` provides `node_modules/.bin/tsc`.
- [ ] `pnpm check` passes without global packages.
- [ ] The compiler version is locked.
- [ ] The scheduled validation step can reach tests after typechecking.

## Work Log

### 2026-08-02 - Clean-PATH reproduction

**By:** Codex

**Actions:** Ran the check with only project binaries available; it exited 127.
**Learnings:** The successful local check depended on global TypeScript 5.3.3.
