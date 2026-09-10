import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { rmSync } from "node:fs";

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

  const slots = await req("/api/slots", { token: client.data.token });
  assert(slots.data.slots.length > 0, "open slots");

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
  assert(pay.status === 200 && pay.data.booking.paymentStatus === "paid", "demo pay");

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

  console.log("api tests passed");
  child.kill("SIGTERM");
  process.exit(0);
} catch (err) {
  console.error(err);
  child.kill("SIGTERM");
  process.exit(1);
}
