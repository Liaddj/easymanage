# ADR-001: v1 architecture (payments deferred)

**Status:** Accepted

Canonical copy lives in [ARCHITECTURE.md](../../ARCHITECTURE.md). This file exists so architecture decisions have a stable path under `docs/adr/`.

- Client: React Native (Expo), dual role provider/client.
- API: Node/TypeScript + Postgres; BFF/API boundary; secrets out of repo; feature flags from day one.
- Calendar: Google OAuth one-way provider → Flow (design hooks in this PR; full sync later).
- Timezone: `Asia/Jerusalem`.
- Payments: deferred. No PSP, card/PAN fields, `/payment*` routes or stubs, invoices, or late-cancel penalty engine.
