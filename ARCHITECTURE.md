# Architecture

Flow is an Israel-only dual-sided (provider / client) booking product for solo fitness and tennis coaches. This document is the v1 architecture record.

## ADR-001: v1 architecture (payments deferred)

**Status:** Accepted

### Context

We need a secure, production-minded baseline before auth, booking, or calendar sync land. Payments are a post-MVP concern and must not leak into v1 schemas or routes.

### Decision

1. **Client:** React Native via Expo. One app, two roles (provider and client).
2. **API:** Node.js + TypeScript. PostgreSQL is the system of record. The mobile app is a BFF client of `apps/api` only — third-party credentials (Google, later a PSP) stay on the server.
3. **Secrets:** Never committed. Local config is `.env` (gitignored). `.env.example` is placeholders only.
4. **Feature flags:** Env-driven from day one. Calendar sync is flagged off until that PR.
5. **Timezone:** All v1 scheduling and display semantics use `Asia/Jerusalem`.
6. **Calendar:** Google OAuth, one-way provider → Flow. This repo may contain design hooks (scopes, module folder). Full sync is later PRs.
7. **Payments:** Out of v1. No PSP, no card/PAN fields, no `/payment*` routes or stubs, no invoices, no late-cancel penalty engine.

### v1 in

- Auth (provider and client)
- Availability and booking
- Reminders
- One-way Google Calendar sync
- Client list

### v1 out / post-MVP appendix (do not build now)

- Certified Israeli PSP
- Tokenize / charge / refund
- Payment audit log and idempotency keys
- Signed PSP webhooks
- Any in-app card capture or PAN storage

### Consequences

- Monorepo layout (`apps/mobile`, `apps/api`, `packages/shared`) with strict TypeScript and CI (lint, typecheck, unit tests).
- API health/smoke only in PR #1; domain modules are empty folders/hooks.
- Later PRs add auth, booking, reminders, and calendar inside existing module boundaries — not a payments stack.
