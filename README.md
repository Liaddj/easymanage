# Flow

Israel-only dual-sided booking app for solo fitness and tennis coaches.

v1 is **provider + client auth**, availability and booking, reminders, one-way Google Calendar sync (provider → Flow), and a client list. Timezone is **Asia/Jerusalem**.

v1 has **no payment surface**: no PSP, no card/PAN fields, no `/payment*` routes or stubs, no invoices, no late-cancel penalty engine.

This repository is a TypeScript monorepo:

| Path              | Package        | Role                                                          |
| ----------------- | -------------- | ------------------------------------------------------------- |
| `apps/mobile`     | `@flow/mobile` | React Native (Expo) client — provider and client roles        |
| `apps/api`        | `@flow/api`    | Node.js + TypeScript API (BFF). Mobile talks only to this API |
| `packages/shared` | `@flow/shared` | Shared constants (timezone, roles, app name)                  |

See [ARCHITECTURE.md](./ARCHITECTURE.md) for ADR-001 (payments deferred, timezone, calendar).

## Prerequisites

- Node.js 22+ (see `.nvmrc`)
- npm 10+
- Optional: Docker, for local Postgres (`docker compose up postgres`)
- Optional: Expo Go / iOS Simulator / Android emulator for the mobile app

## Local setup

```bash
git clone https://github.com/Liaddj/easymanage.git
cd easymanage
npm install
cp .env.example .env
```

`.env` is gitignored. Fill placeholders locally. Do not commit secrets or production credentials.

Optional database (not required for the health endpoint):

```bash
docker compose up -d postgres
```

## Run

API (health at `GET http://localhost:3000/health`):

```bash
npm run dev:api
```

Mobile (Expo):

```bash
npm run dev:mobile
```

Then open in Expo Go, an emulator, or the web target.

## Checks

Same commands as CI:

```bash
npm run lint
npm run format:check
npm run typecheck
npm test
```

Format:

```bash
npm run format
```

## Security defaults

- Secrets stay out of git (`.env*` ignored except `.env.example`)
- `.env.example` contains placeholders only
- Google OAuth client secrets belong on the API, never in the mobile app
- Feature flags are read from env from day one (`FEATURE_GOOGLE_CALENDAR_SYNC`)

## Explicitly out of v1

Do not add payment schemas, card fields, PSP keys, `/payment*` routes, invoices, or late-cancel penalty engines.
