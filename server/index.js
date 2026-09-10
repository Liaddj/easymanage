import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { timingSafeEqual } from "node:crypto";
import express from "express";
import { bookingToIcs } from "../shared/ics.js";
import {
  bookingById,
  cancelBooking,
  coachInvite,
  createBooking,
  defaultProviderId,
  demoCharge,
  getAvailability,
  getInvite,
  getUserById,
  listBookingsForUser,
  listClients,
  listOpenSlots,
  login,
  redeemInvite,
  register,
  rejectCardFields,
  reminderLog,
  remindersFor,
  setAvailability,
  toggleAvailability,
  verifyToken,
} from "./store.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

loadDotEnv(join(ROOT, ".env"));

const PORT = Number(process.env.PORT || 3780);
const GATE_DISABLED = process.env.GATE_DISABLED === "1";
const GATE_USER = process.env.GATE_USER || "liad";
const GATE_PASSWORD = process.env.GATE_PASSWORD || "";
const GATE_PATH = sanitizePath(process.env.GATE_PATH || "");

if (!GATE_DISABLED && (!GATE_PASSWORD || !GATE_PATH)) {
  console.error("GATE_PASSWORD and GATE_PATH must be set (or GATE_DISABLED=1 for local dev).");
  process.exit(1);
}

const mount = GATE_DISABLED ? "" : `/${GATE_PATH}`;
const dist = join(ROOT, "web", "dist");

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "64kb" }));

app.get("/healthz", (_req, res) => {
  res.json({ ok: true });
});

if (!GATE_DISABLED) {
  app.use(mount, basicAuth(GATE_USER, GATE_PASSWORD));
}

const api = express.Router();

api.get("/health", (_req, res) => {
  res.json({
    ok: true,
    tz: "Asia/Jerusalem",
    calendar: "ics",
    payments: "demo",
    note: "Google Calendar OAuth is off. Export ICS or use in-app reminders. Payments are demo-only — no cards.",
  });
});

api.post("/auth/login", (req, res) => {
  const result = login(req.body?.email, req.body?.password);
  if (!result) return res.status(401).json({ error: "invalid_credentials" });
  res.json(result);
});

api.post("/auth/register", (req, res) => {
  try {
    const result = register({
      email: req.body?.email,
      password: req.body?.password,
      name: req.body?.name,
      role: req.body?.role,
      inviteCode: req.body?.inviteCode,
    });
    res.status(201).json(result);
  } catch (err) {
    const status = err.message === "email_taken" ? 409 : 400;
    res.status(status).json({ error: err.message });
  }
});

api.get("/me", requireUser, (req, res) => {
  res.json({ user: publicSafe(req.user) });
});

api.get("/availability", requireUser, (req, res) => {
  const providerId = req.user.role === "provider" ? req.user.id : defaultProviderId();
  res.json({ slots: getAvailability(providerId), calendar: "disabled" });
});

api.put("/availability", requireUser, requireProvider, (req, res) => {
  res.json({ slots: setAvailability(req.user.id, req.body?.slots) });
});

api.post("/availability/toggle", requireUser, requireProvider, (req, res) => {
  const weekday = Number(req.body?.weekday);
  const hour = Number(req.body?.hour);
  res.json({ slots: toggleAvailability(req.user.id, weekday, hour) });
});

api.get("/slots", requireUser, (req, res) => {
  const providerId = req.user.role === "provider" ? req.user.id : defaultProviderId();
  res.json({ slots: listOpenSlots(providerId, 14) });
});

api.get("/bookings", requireUser, (req, res) => {
  res.json({ bookings: listBookingsForUser(req.user) });
});

api.post("/bookings", requireUser, (req, res) => {
  if (req.user.role !== "client") return res.status(403).json({ error: "clients_only" });
  try {
    const booking = createBooking(req.user.id, req.body?.start);
    res.status(201).json({ booking });
  } catch (err) {
    const map = { taken: 409, past_slot: 400, not_available: 400, bad_slot: 400 };
    res.status(map[err.message] || 400).json({ error: err.message });
  }
});

api.post("/bookings/:id/cancel", requireUser, (req, res) => {
  try {
    const booking = cancelBooking(req.user, req.params.id);
    res.json({ booking });
  } catch (err) {
    const map = { not_found: 404, forbidden: 403 };
    res.status(map[err.message] || 400).json({ error: err.message });
  }
});

api.get("/clients", requireUser, requireProvider, (req, res) => {
  res.json({ clients: listClients(req.user.id) });
});

api.get("/reminders", requireUser, (req, res) => {
  res.json({
    banners: remindersFor(req.user),
    log: req.user.role === "provider" ? reminderLog(req.user.id) : [],
    channel: "in-app",
  });
});

api.get("/invite", requireUser, requireProvider, (req, res) => {
  res.json(coachInvite(req.user.id));
});

api.get("/invite/:code", (req, res) => {
  const invite = getInvite(req.params.code);
  if (!invite) return res.status(404).json({ error: "bad_invite" });
  res.json(invite);
});

api.post("/invite/redeem", requireUser, (req, res) => {
  try {
    res.json(redeemInvite(req.user, req.body?.code));
  } catch (err) {
    const map = { bad_invite: 404, clients_only: 403 };
    res.status(map[err.message] || 400).json({ error: err.message });
  }
});

api.get("/bookings/:id/ics", requireUser, (req, res) => {
  const booking = bookingById(req.params.id);
  if (!booking) return res.status(404).json({ error: "not_found" });
  const allowed =
    req.user.role === "provider" ? booking.provider?.id === req.user.id : booking.client?.id === req.user.id;
  if (!allowed) return res.status(403).json({ error: "forbidden" });
  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="flow-${booking.id}.ics"`);
  res.send(bookingToIcs(booking));
});

api.post("/payments/demo-charge", requireUser, (req, res) => {
  if (rejectCardFields(req.body)) {
    return res.status(400).json({ error: "cards_not_accepted" });
  }
  try {
    const result = demoCharge(req.user, {
      bookingId: req.body?.bookingId,
      idempotencyKey: req.body?.idempotencyKey,
    });
    res.json({ ...result, mode: "demo", note: "דמו תשלום — no cards collected" });
  } catch (err) {
    const map = { not_found: 404, forbidden: 403, cancelled: 400, missing_fields: 400 };
    res.status(map[err.message] || 400).json({ error: err.message });
  }
});

app.use(`${mount}/api`, api);

app.use((req, res, next) => {
  if (/\/(card|pan|cvv)\b/i.test(req.path)) {
    return res.status(404).json({ error: "not_found" });
  }
  next();
});

if (existsSync(dist)) {
  app.use(mount || "/", express.static(dist, { index: "index.html" }));
  app.get(`${mount}/*`, (req, res, next) => {
    if (req.path.startsWith(`${mount}/api`)) return next();
    res.sendFile(join(dist, "index.html"));
  });
} else if (!GATE_DISABLED) {
  app.get(`${mount}/`, (_req, res) => {
    res.status(503).send("Build missing. Run npm run build.");
  });
}

if (!GATE_DISABLED) {
  app.use((_req, res) => {
    res.status(404).send("Not found");
  });
}

app.listen(PORT, "0.0.0.0", () => {
  const local = GATE_DISABLED
    ? `http://127.0.0.1:${PORT}`
    : `http://127.0.0.1:${PORT}${mount}/`;
  console.log(`Flow listening on ${local}`);
  if (!GATE_DISABLED) {
    console.log("Closed demo: Basic Auth + secret path enabled.");
  }
});

function publicSafe(user) {
  const { password, ...rest } = user;
  return rest;
}

function requireUser(req, res, next) {
  // App session uses X-Flow-Token so the browser can still send HTTP Basic Auth.
  const token = req.headers["x-flow-token"] || "";
  const userId = verifyToken(token);
  const user = userId ? getUserById(userId) : null;
  if (!user) return res.status(401).json({ error: "unauthorized" });
  req.user = user;
  next();
}

function requireProvider(req, res, next) {
  if (req.user?.role !== "provider") return res.status(403).json({ error: "providers_only" });
  next();
}

function basicAuth(user, password) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Basic ")) {
      res.set("WWW-Authenticate", 'Basic realm="Flow"');
      return res.status(401).send("Authentication required");
    }
    let decoded = "";
    try {
      decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    } catch {
      res.set("WWW-Authenticate", 'Basic realm="Flow"');
      return res.status(401).send("Authentication required");
    }
    const idx = decoded.indexOf(":");
    const u = idx >= 0 ? decoded.slice(0, idx) : "";
    const p = idx >= 0 ? decoded.slice(idx + 1) : "";
    if (!safeEqual(u, user) || !safeEqual(p, password)) {
      res.set("WWW-Authenticate", 'Basic realm="Flow"');
      return res.status(401).send("Authentication required");
    }
    next();
  };
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function sanitizePath(value) {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "");
}

function loadDotEnv(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}
