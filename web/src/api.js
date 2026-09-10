const TOKEN_KEY = "flow_token";
const USER_KEY = "flow_user";

function apiRoot() {
  const path = window.location.pathname.replace(/\/index\.html$/, "").replace(/\/+$/, "");
  return `${path || ""}/api`;
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) headers["X-Flow-Token"] = token;
  const res = await fetch(`${apiRoot()}${path}`, {
    ...options,
    headers,
    credentials: "same-origin",
    body: options.body && typeof options.body !== "string" ? JSON.stringify(options.body) : options.body,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text };
  }
  if (!res.ok) {
    const err = new Error(data?.error || `http_${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  health: () => request("/health"),
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password } }),
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  me: () => request("/me"),
  updateMe: (payload) => request("/me", { method: "PATCH", body: payload }),
  availability: () => request("/availability"),
  setAvailability: (slots) => request("/availability", { method: "PUT", body: { slots } }),
  toggleAvailability: (weekday, hour) =>
    request("/availability/toggle", { method: "POST", body: { weekday, hour } }),
  slots: (date) => request(date ? `/slots?date=${encodeURIComponent(date)}` : "/slots"),
  bookings: () => request("/bookings"),
  book: (start) => request("/bookings", { method: "POST", body: { start } }),
  cancel: (id) => request(`/bookings/${id}/cancel`, { method: "POST" }),
  clients: () => request("/clients"),
  addClient: (payload) => request("/clients", { method: "POST", body: payload }),
  updateClient: (id, payload) => request(`/clients/${id}`, { method: "PATCH", body: payload }),
  reminders: () => request("/reminders"),
  invite: () => request("/invite"),
  inviteInfo: (code) => request(`/invite/${encodeURIComponent(code)}`),
  redeemInvite: (code) => request("/invite/redeem", { method: "POST", body: { code } }),
  demoPay: (bookingId, idempotencyKey) =>
    request("/payments/demo-charge", { method: "POST", body: { bookingId, idempotencyKey } }),
  icsUrl: (id) => `${apiRoot()}/bookings/${id}/ics`,
};

export function saveSession(result) {
  localStorage.setItem(TOKEN_KEY, result.token);
  localStorage.setItem(USER_KEY, JSON.stringify(result.user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function readUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function hasToken() {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}
