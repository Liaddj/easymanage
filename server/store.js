import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DEMO_PASSWORD, DEMO_USERS, defaultAvailability } from "../shared/demo.js";
import { addDaysKey, dateKey, hoursUntil, slotStart, zonedParts } from "../shared/time.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || join(__dirname, "..", "data");
const DB_PATH = join(DATA_DIR, "db.json");

const TOKEN_TTL_MS = 7 * 24 * 3600 * 1000;
const SLOT_MINUTES = 60;

function jwtSecret() {
  return process.env.JWT_SECRET || "flow-demo-dev-secret";
}

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const next = scryptSync(password, salt, 32);
  const prev = Buffer.from(hash, "hex");
  return prev.length === next.length && timingSafeEqual(prev, next);
}

function signToken(userId) {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ sub: userId, exp })).toString("base64url");
  const sig = createHmac("sha256", jwtSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyToken(token) {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  const expected = createHmac("sha256", jwtSecret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (data.exp < Date.now()) return null;
  return data.sub;
}

function publicUser(user) {
  return {
    id: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    nameEn: user.nameEn,
    city: user.city,
    cityEn: user.cityEn,
    specialty: user.specialty || "",
    specialtyEn: user.specialtyEn || "",
  };
}

function nid(prefix) {
  return `${prefix}_${randomBytes(6).toString("hex")}`;
}

function emptyDb() {
  return { users: [], availability: [], bookings: [], reminderLog: [], invites: [], payments: [] };
}

function migrate(data) {
  if (!data.invites) data.invites = [];
  if (!data.payments) data.payments = [];
  for (const b of data.bookings || []) {
    if (!b.paymentStatus) {
      b.paymentStatus = new Date(b.start) < new Date() && b.status === "confirmed" ? "paid" : "unpaid";
    }
  }
  if (!data.invites.some((i) => i.providerId === "u_coach")) {
    data.invites.push({
      code: "FLOWNOA",
      providerId: "u_coach",
      createdAt: new Date().toISOString(),
    });
  }
  return data;
}

export function loadDb() {
  if (!existsSync(DB_PATH)) return emptyDb();
  return JSON.parse(readFileSync(DB_PATH, "utf8"));
}

function saveDb(db) {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function seedIfNeeded() {
  mkdirSync(DATA_DIR, { recursive: true });
  if (existsSync(DB_PATH)) {
    const existing = migrate(loadDb());
    if (existing.users?.length) {
      saveDb(existing);
      return existing;
    }
  }

  const users = DEMO_USERS.map((u) => ({
    ...u,
    password: hashPassword(DEMO_PASSWORD),
  }));

  const availability = defaultAvailability().map((s) => ({
    providerId: "u_coach",
    weekday: s.weekday,
    hour: s.hour,
  }));

  const today = dateKey(new Date());
  const bookings = [
    {
      id: "b_past_1",
      providerId: "u_coach",
      clientId: "u_client",
      start: slotStart(addDaysKey(today, -2), 9).toISOString(),
      end: slotStart(addDaysKey(today, -2), 10).toISOString(),
      status: "confirmed",
      paymentStatus: "paid",
      createdAt: new Date().toISOString(),
    },
    {
      id: "b_soon",
      providerId: "u_coach",
      clientId: "u_client",
      start: slotStart(addDaysKey(today, 1), 18).toISOString(),
      end: slotStart(addDaysKey(today, 1), 19).toISOString(),
      status: "confirmed",
      paymentStatus: "unpaid",
      createdAt: new Date().toISOString(),
    },
    {
      id: "b_michal",
      providerId: "u_coach",
      clientId: "u_michal",
      start: slotStart(addDaysKey(today, 2), 8).toISOString(),
      end: slotStart(addDaysKey(today, 2), 9).toISOString(),
      status: "confirmed",
      paymentStatus: "unpaid",
      createdAt: new Date().toISOString(),
    },
    {
      id: "b_yossi",
      providerId: "u_coach",
      clientId: "u_yossi",
      start: slotStart(addDaysKey(today, 3), 16).toISOString(),
      end: slotStart(addDaysKey(today, 3), 17).toISOString(),
      status: "confirmed",
      paymentStatus: "unpaid",
      createdAt: new Date().toISOString(),
    },
  ];

  const reminderLog = bookings
    .filter((b) => hoursUntil(b.start) > 0 && hoursUntil(b.start) < 48)
    .map((b) => ({
      id: nid("r"),
      bookingId: b.id,
      at: new Date().toISOString(),
      channel: "in-app",
      message: `תזכורת מתוזמנת לאימון ב-${b.start}`,
    }));

  const invites = [{ code: "FLOWNOA", providerId: "u_coach", createdAt: new Date().toISOString() }];
  const db = migrate({ users, availability, bookings, reminderLog, invites, payments: [] });
  saveDb(db);
  return db;
}

let db = seedIfNeeded();

function refresh() {
  db = loadDb();
}

function persist() {
  saveDb(db);
}

export function getUserById(id) {
  return db.users.find((u) => u.id === id) || null;
}

export function login(email, password) {
  refresh();
  const user = db.users.find((u) => u.email.toLowerCase() === String(email || "").toLowerCase());
  if (!user || !verifyPassword(password, user.password)) return null;
  return { token: signToken(user.id), user: publicUser(user) };
}

export function register({ email, password, name, role, inviteCode }) {
  refresh();
  const clean = String(email || "").trim().toLowerCase();
  if (!clean || !password || !name) {
    throw new Error("missing_fields");
  }
  if (db.users.some((u) => u.email.toLowerCase() === clean)) {
    throw new Error("email_taken");
  }
  const invite = inviteCode ? peekInvite(inviteCode) : null;
  const user = {
    id: nid("u"),
    role: role === "provider" ? "provider" : "client",
    email: clean,
    name: String(name).trim(),
    nameEn: String(name).trim(),
    city: "",
    cityEn: "",
    specialty: role === "provider" ? "אימון אישי" : "",
    specialtyEn: role === "provider" ? "Personal training" : "",
    invitedBy: invite && role !== "provider" ? invite.providerId : null,
    password: hashPassword(password),
  };
  db.users.push(user);
  if (user.role === "provider") {
    for (const s of defaultAvailability()) {
      db.availability.push({ providerId: user.id, weekday: s.weekday, hour: s.hour });
    }
  }
  persist();
  return { token: signToken(user.id), user: publicUser(user) };
}

export function getAvailability(providerId) {
  refresh();
  return db.availability
    .filter((s) => s.providerId === providerId)
    .map((s) => ({ weekday: s.weekday, hour: s.hour }));
}

export function setAvailability(providerId, slots) {
  refresh();
  const clean = [];
  const seen = new Set();
  for (const s of slots || []) {
    const weekday = Number(s.weekday);
    const hour = Number(s.hour);
    if (weekday < 0 || weekday > 6 || hour < 5 || hour > 22) continue;
    const key = `${weekday}-${hour}`;
    if (seen.has(key)) continue;
    seen.add(key);
    clean.push({ providerId, weekday, hour });
  }
  db.availability = db.availability.filter((s) => s.providerId !== providerId).concat(clean);
  persist();
  return getAvailability(providerId);
}

export function toggleAvailability(providerId, weekday, hour) {
  const slots = getAvailability(providerId);
  const exists = slots.some((s) => s.weekday === weekday && s.hour === hour);
  const next = exists
    ? slots.filter((s) => !(s.weekday === weekday && s.hour === hour))
    : slots.concat([{ weekday, hour }]);
  return setAvailability(providerId, next);
}

function bookedStarts(providerId) {
  return new Set(
    db.bookings
      .filter((b) => b.providerId === providerId && b.status === "confirmed")
      .map((b) => b.start)
  );
}

export function listOpenSlots(providerId, days = 14) {
  refresh();
  const avail = getAvailability(providerId);
  const taken = bookedStarts(providerId);
  const todayKey = dateKey(new Date());
  const now = Date.now();
  const out = [];
  for (let i = 0; i < days; i += 1) {
    const key = addDaysKey(todayKey, i);
    const probe = slotStart(key, 12);
    const weekday = zonedParts(probe).weekday;
    const hours = avail.filter((s) => s.weekday === weekday).map((s) => s.hour);
    for (const hour of hours) {
      const start = slotStart(key, hour);
      if (start.getTime() <= now) continue;
      const iso = start.toISOString();
      if (taken.has(iso)) continue;
      const end = new Date(start.getTime() + SLOT_MINUTES * 60000).toISOString();
      out.push({ start: iso, end, dateKey: key, hour, weekday });
    }
  }
  return out;
}

export function listBookingsForUser(user) {
  refresh();
  const rows = db.bookings.filter((b) =>
    user.role === "provider" ? b.providerId === user.id : b.clientId === user.id
  );
  return rows
    .map(enrichBooking)
    .sort((a, b) => new Date(a.start) - new Date(b.start));
}

function enrichBooking(b) {
  const client = db.users.find((u) => u.id === b.clientId);
  const provider = db.users.find((u) => u.id === b.providerId);
  return {
    id: b.id,
    start: b.start,
    end: b.end,
    status: b.status,
    paymentStatus: b.paymentStatus || "unpaid",
    createdAt: b.createdAt,
    client: client ? publicUser(client) : null,
    provider: provider ? publicUser(provider) : null,
  };
}

export function createBooking(clientId, startIso) {
  refresh();
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) throw new Error("bad_slot");
  if (start.getTime() <= Date.now()) throw new Error("past_slot");

  const providerId = "u_coach";
  const parts = zonedParts(start);
  const key = dateKey(start);
  const expected = slotStart(key, parts.hour).toISOString();
  if (expected !== start.toISOString()) throw new Error("bad_slot");

  const avail = getAvailability(providerId);
  if (!avail.some((s) => s.weekday === parts.weekday && s.hour === parts.hour)) {
    throw new Error("not_available");
  }
  if (bookedStarts(providerId).has(start.toISOString())) {
    throw new Error("taken");
  }

  const booking = {
    id: nid("b"),
    providerId,
    clientId,
    start: start.toISOString(),
    end: new Date(start.getTime() + SLOT_MINUTES * 60000).toISOString(),
    status: "confirmed",
    paymentStatus: "unpaid",
    createdAt: new Date().toISOString(),
  };
  db.bookings.push(booking);
  persist();
  return enrichBooking(booking);
}

export function cancelBooking(user, bookingId) {
  refresh();
  const booking = db.bookings.find((b) => b.id === bookingId);
  if (!booking) throw new Error("not_found");
  const allowed = user.role === "provider" ? booking.providerId === user.id : booking.clientId === user.id;
  if (!allowed) throw new Error("forbidden");
  if (booking.status === "cancelled") return enrichBooking(booking);
  booking.status = "cancelled";
  persist();
  return enrichBooking(booking);
}

export function listClients(providerId) {
  refresh();
  const byClient = new Map();
  for (const b of db.bookings.filter((x) => x.providerId === providerId)) {
    const cur = byClient.get(b.clientId) || [];
    cur.push(b);
    byClient.set(b.clientId, cur);
  }
  for (const u of db.users.filter((x) => x.role === "client" && x.invitedBy === providerId)) {
    if (!byClient.has(u.id)) byClient.set(u.id, []);
  }
  return [...byClient.entries()].map(([clientId, rows]) => {
    const user = db.users.find((u) => u.id === clientId);
    const upcoming = rows
      .filter((b) => b.status === "confirmed" && new Date(b.start) > new Date())
      .sort((a, b) => new Date(a.start) - new Date(b.start))[0];
    const last = rows
      .filter((b) => b.status === "confirmed" && new Date(b.start) <= new Date())
      .sort((a, b) => new Date(b.start) - new Date(a.start))[0];
    return {
      client: user ? publicUser(user) : { id: clientId, name: "?", email: "" },
      upcoming: upcoming ? enrichBooking(upcoming) : null,
      last: last ? enrichBooking(last) : null,
      total: rows.filter((b) => b.status === "confirmed").length,
    };
  });
}

export function remindersFor(user) {
  refresh();
  const mine = listBookingsForUser(user).filter(
    (b) => b.status === "confirmed" && hoursUntil(b.start) > 0 && hoursUntil(b.start) <= 24
  );
  return mine.map((b) => ({
    id: `banner_${b.id}`,
    kind: "upcoming",
    booking: b,
    hours: hoursUntil(b.start),
  }));
}

export function reminderLog(providerId) {
  refresh();
  const ids = new Set(db.bookings.filter((b) => b.providerId === providerId).map((b) => b.id));
  return db.reminderLog.filter((r) => ids.has(r.bookingId));
}

export function defaultProviderId() {
  return "u_coach";
}

function peekInvite(code) {
  const clean = String(code || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return db.invites.find((i) => i.code === clean) || null;
}

export function getInvite(code) {
  refresh();
  const invite = peekInvite(code);
  if (!invite) return null;
  const provider = db.users.find((u) => u.id === invite.providerId);
  return { code: invite.code, provider: provider ? publicUser(provider) : null };
}

export function coachInvite(providerId) {
  refresh();
  let invite = db.invites.find((i) => i.providerId === providerId);
  if (!invite) {
    invite = { code: randomBytes(3).toString("hex").toUpperCase(), providerId, createdAt: new Date().toISOString() };
    db.invites.push(invite);
    persist();
  }
  const provider = db.users.find((u) => u.id === providerId);
  return { code: invite.code, provider: provider ? publicUser(provider) : null };
}

export function redeemInvite(user, code) {
  refresh();
  const invite = peekInvite(code);
  if (!invite) throw new Error("bad_invite");
  if (user.role !== "client") throw new Error("clients_only");
  const row = db.users.find((u) => u.id === user.id);
  row.invitedBy = invite.providerId;
  persist();
  return { ok: true, provider: getInvite(code).provider };
}

export function bookingById(id) {
  refresh();
  const b = db.bookings.find((x) => x.id === id);
  return b ? enrichBooking(b) : null;
}

const CARD_KEYS = /^(card|pan|cvv|cvc|number|exp|expiry|cardnumber|card_number)$/i;

export function rejectCardFields(body) {
  if (!body || typeof body !== "object") return false;
  return Object.keys(body).some((k) => CARD_KEYS.test(k));
}

export function demoCharge(user, { bookingId, idempotencyKey }) {
  refresh();
  if (!bookingId || !idempotencyKey) throw new Error("missing_fields");
  const booking = db.bookings.find((b) => b.id === bookingId);
  if (!booking) throw new Error("not_found");
  const allowed = user.role === "client" ? booking.clientId === user.id : booking.providerId === user.id;
  if (!allowed) throw new Error("forbidden");
  if (booking.status === "cancelled") throw new Error("cancelled");

  const prior = db.payments.find((p) => p.idempotencyKey === String(idempotencyKey));
  if (prior) {
    return { booking: enrichBooking(booking), payment: prior, replayed: true };
  }

  const payment = {
    id: nid("p"),
    bookingId,
    idempotencyKey: String(idempotencyKey),
    status: "paid",
    provider: "demo",
    amount: 0,
    currency: "ILS",
    createdAt: new Date().toISOString(),
  };
  db.payments.push(payment);
  booking.paymentStatus = "paid";
  persist();
  return { booking: enrichBooking(booking), payment, replayed: false };
}

