import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readdirSync, readFileSync, rmSync } from "node:fs";
import { dateKey, monthGrid, parseDateKey } from "../shared/time.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 3791;
const dataDir = join(root, "data-test");

rmSync(dataDir, { recursive: true, force: true });

const child = spawn(process.execPath, [join(root, "server", "index.js")], {
  env: {
    ...process.env,
    PORT: String(port),
    GATE_DISABLED: "1",
    DATA_DIR: dataDir,
    JWT_SECRET: "test-secret",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

function waitReady() {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("server_timeout")), 8000);
    child.stdout.on("data", (buf) => {
      if (String(buf).includes("listening")) {
        clearTimeout(t);
        resolve();
      }
    });
    child.stderr.on("data", (buf) => {
      const s = String(buf);
      if (s.includes("listening")) {
        clearTimeout(t);
        resolve();
      }
    });
  });
}

async function req(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["X-Flow-Token"] = token;
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

try {
  await waitReady();

  const health = await req("/api/health");
  assert(health.status === 200 && health.data.ok, "health");

  const bad = await req("/api/auth/login", {
    method: "POST",
    body: { email: "coach@flow.demo", password: "nope" },
  });
  assert(bad.status === 401, "bad login");

  const coach = await req("/api/auth/login", {
    method: "POST",
    body: { email: "coach@flow.demo", password: "demo123" },
  });
  assert(coach.status === 200 && coach.data.user.role === "provider", "coach login");

  const client = await req("/api/auth/login", {
    method: "POST",
    body: { email: "client@flow.demo", password: "demo123" },
  });
  assert(client.status === 200 && client.data.user.role === "client", "client login");

  assert(parseDateKey("2026-09-10")?.day === 10, "parse date key");
  assert(!parseDateKey("nope"), "reject bad date key");
  assert(monthGrid(2026, 9).filter(Boolean).length === 30, "sept 2026 grid");
  assert(monthGrid(2028, 2).filter(Boolean).length === 29, "feb 2028 leap");

  const slots = await req("/api/slots", { token: client.data.token });
  assert(slots.data.slots.length > 0, "open slots");
  const dayKey = slots.data.slots[0].dateKey;
  const dayOnly = await req(`/api/slots?date=${dayKey}`, { token: client.data.token });
  assert(dayOnly.status === 200, "day slots status");
  assert(dayOnly.data.slots.length > 0, "day slots");
  assert(dayOnly.data.slots.every((s) => s.dateKey === dayKey), "day slots filtered");
  const badDate = await req("/api/slots?date=nope", { token: client.data.token });
  assert(badDate.status === 400, "bad date rejected");
  const emptyDay = await req(`/api/slots?date=${dateKey(new Date("1999-01-01T12:00:00Z"))}`, {
    token: client.data.token,
  });
  assert(emptyDay.status === 200 && emptyDay.data.slots.length === 0, "past date no slots");

  const booked = await req("/api/bookings", {
    method: "POST",
    token: client.data.token,
    body: { start: slots.data.slots[0].start },
  });
  assert(booked.status === 201 && booked.data.booking.status === "confirmed", "book");

  const again = await req("/api/bookings", {
    method: "POST",
    token: client.data.token,
    body: { start: slots.data.slots[0].start },
  });
  assert(again.status === 409, "double book blocked");

  const list = await req("/api/bookings", { token: client.data.token });
  assert(list.data.bookings.some((b) => b.id === booked.data.booking.id), "client bookings");

  const clients = await req("/api/clients", { token: coach.data.token });
  assert(clients.data.clients.length >= 1, "provider clients");
  assert(clients.data.clients.some((row) => row.client.phone), "client phone field");

  const patched = await req("/api/me", {
    method: "PATCH",
    token: client.data.token,
    body: { phone: "052-9999999", city: "גבעתיים" },
  });
  assert(patched.status === 200 && patched.data.user.phone === "052-9999999", "update profile");

  const added = await req("/api/clients", {
    method: "POST",
    token: coach.data.token,
    body: { name: "עדי כהן", email: "adi@flow.demo", phone: "050-1111111", notes: "בוקר" },
  });
  assert(added.status === 201 && added.data.client.name === "עדי כהן", "add client");

  const noted = await req(`/api/clients/${added.data.client.id}`, {
    method: "PATCH",
    token: coach.data.token,
    body: { notes: "מעדיפה בוקר" },
  });
  assert(noted.status === 200 && noted.data.client.notes === "מעדיפה בוקר", "client notes");

  const nestedCard = await req("/api/payments/demo-charge", {
    method: "POST",
    token: client.data.token,
    body: { bookingId: "x", card: { number: "4242424242424242", cvv: "123" } },
  });
  assert(nestedCard.status === 400 && nestedCard.data.error === "cards_not_accepted", "reject nested cards");

  const cards = await req("/api/payments/demo-charge", {
    method: "POST",
    token: client.data.token,
    body: { bookingId: booked.data.booking.id, card: "4242424242424242", cvv: "123" },
  });
  assert(cards.status === 400 && cards.data.error === "cards_not_accepted", "reject cards");

  const pay = await req("/api/payments/demo-charge", {
    method: "POST",
    token: client.data.token,
    body: { bookingId: booked.data.booking.id, idempotencyKey: "k1" },
  });
  assert(pay.status === 200 && pay.data.booking.paymentStatus === "paid" && pay.data.mode === "sandbox", "demo pay");

  const replay = await req("/api/payments/demo-charge", {
    method: "POST",
    token: client.data.token,
    body: { bookingId: booked.data.booking.id, idempotencyKey: "k1" },
  });
  assert(replay.status === 200 && replay.data.replayed === true, "idempotent pay");

  const gone = await req(`/api/bookings/${booked.data.booking.id}/cancel`, {
    method: "POST",
    token: client.data.token,
  });
  assert(gone.status === 200 && gone.data.booking.status === "cancelled", "cancel");
  const after = await req("/api/bookings", { token: client.data.token });
  const still = after.data.bookings.find((b) => b.id === booked.data.booking.id);
  assert(still.status === "cancelled", "cancelled persisted");

  const invite = await req("/api/invite", { token: coach.data.token });
  assert(invite.status === 200 && invite.data.code, "invite");

  const cardPath = await req("/api/card", { token: client.data.token });
  assert(cardPath.status === 404, "no card route");

  function walk(dir) {
    const out = [];
    for (const name of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, name.name);
      if (name.isDirectory()) out.push(...walk(p));
      else if (/\.(js|jsx|html|css)$/.test(name.name)) out.push(p);
    }
    return out;
  }
  const forbidden = /autocomplete=["']cc-|[^a-z]name=["'](card|cvv|cvc|pan|cardNumber)["']|invoice|refund/i;
  for (const file of walk(join(root, "web", "src"))) {
    const text = readFileSync(file, "utf8");
    assert(!forbidden.test(text), `ship-stop card/invoice field in ${file}`);
  }

  console.log("api tests passed");
  child.kill("SIGTERM");
  process.exit(0);
} catch (err) {
  console.error(err);
  child.kill("SIGTERM");
  process.exit(1);
}
