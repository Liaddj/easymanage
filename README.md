# Flow (פלואו)

Dual-sided booking for solo fitness and tennis coaches. Hebrew-first UI, timezone `Asia/Jerusalem`.

Clients pick a **date** on a phone calendar sheet, then see **free slots for that day only**, then confirm. Success and error toasts: הצלחה / שגיאה.

This demo has **sandbox/mock payments only** (no PAN/CVV, no invoices, no real money). Google Calendar OAuth is off; ICS export is available.

## Stack

React + Vite + Express (Node.js) + plain CSS. One process: Express serves the API and the Vite build.

## Local development

```bash
cp .env.example .env
# For local only:
# GATE_DISABLED=1
npm install
npm run dev
```

App: `http://127.0.0.1:5173` (Vite) talking to `http://127.0.0.1:3780/api`.

```bash
npm run build
GATE_DISABLED=1 npm start
```

## Closed demo (production on this host)

Set in `.env` (never commit real values):

- `GATE_USER` / `GATE_PASSWORD` — HTTP Basic Auth
- `GATE_PATH` — unguessable URL path segment
- `JWT_SECRET`

Then:

```bash
npm run build
npm start
```

The app is only reachable at `/${GATE_PATH}/` after Basic Auth. Other paths return 404.

## Demo accounts (inside the app)

| Role     | Email              | Password |
|----------|--------------------|----------|
| Provider | coach@flow.demo    | demo123  |
| Client   | client@flow.demo   | demo123  |

## $0 hosting

This demo is meant to run on a free host or a Cursor VM plus a **Cloudflare Quick Tunnel** (`trycloudflare.com`) — no paid plan and no credit card.
