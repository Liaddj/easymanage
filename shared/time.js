export const TZ = "Asia/Jerusalem";

const WEEKDAYS_HE = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const WEEKDAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function pad(n) {
  return String(n).padStart(2, "0");
}

export function tzOffsetMs(timeZone, date) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(dtf.formatToParts(date).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return asUtc - date.getTime();
}

export function wallTimeToDate(year, month, day, hour, minute = 0, timeZone = TZ) {
  let utc = Date.UTC(year, month - 1, day, hour, minute);
  for (let i = 0; i < 3; i += 1) {
    const off = tzOffsetMs(timeZone, new Date(utc));
    utc = Date.UTC(year, month - 1, day, hour, minute) - off;
  }
  return new Date(utc);
}

export function zonedParts(date, timeZone = TZ) {
  const dtf = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(dtf.formatToParts(date).map((p) => [p.type, p.value]));
  const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: weekdayMap[parts.weekday] ?? 0,
  };
}

export function dateKey(date, timeZone = TZ) {
  const p = zonedParts(date, timeZone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export function formatDate(iso, lang = "he") {
  const date = new Date(iso);
  const locale = lang === "he" ? "he-IL" : "en-GB";
  return new Intl.DateTimeFormat(locale, {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

export function formatTime(iso) {
  const p = zonedParts(new Date(iso));
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

export function formatDateTime(iso, lang = "he") {
  return `${formatDate(iso, lang)} · ${formatTime(iso)}`;
}

export function weekdayName(weekday, lang = "he") {
  return lang === "he" ? WEEKDAYS_HE[weekday] : WEEKDAYS_EN[weekday];
}

export function addDaysKey(key, days) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = wallTimeToDate(y, m, d, 12, 0);
  dt.setTime(dt.getTime() + days * 86400000);
  return dateKey(dt);
}

export function startOfDay(key) {
  const [y, m, d] = key.split("-").map(Number);
  return wallTimeToDate(y, m, d, 0, 0);
}

export function slotStart(key, hour) {
  const [y, m, d] = key.split("-").map(Number);
  return wallTimeToDate(y, m, d, hour, 0);
}

export function hoursUntil(iso) {
  return (new Date(iso).getTime() - Date.now()) / 3600000;
}

export function isPast(iso) {
  return new Date(iso).getTime() < Date.now();
}

export function todayKey(timeZone = TZ) {
  return dateKey(new Date(), timeZone);
}

export function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function monthGrid(year, month) {
  const dim = daysInMonth(year, month);
  const firstWeekday = zonedParts(wallTimeToDate(year, month, 1, 12, 0)).weekday;
  const cells = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let day = 1; day <= dim; day += 1) {
    cells.push({ key: `${year}-${pad(month)}-${pad(day)}`, day });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function shiftMonth(year, month, delta) {
  const idx = year * 12 + (month - 1) + delta;
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}

export function formatDateLong(key, lang = "he") {
  const [y, m, d] = String(key).split("-").map(Number);
  const date = wallTimeToDate(y, m, d, 12, 0);
  const locale = lang === "he" ? "he-IL" : "en-GB";
  return new Intl.DateTimeFormat(locale, {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

export function monthTitle(year, month, lang = "he") {
  const date = wallTimeToDate(year, month, 1, 12, 0);
  const locale = lang === "he" ? "he-IL" : "en-GB";
  return new Intl.DateTimeFormat(locale, {
    timeZone: TZ,
    month: "long",
    year: "numeric",
  }).format(date);
}

export function parseDateKey(key) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(key || ""))) return null;
  const [year, month, day] = key.split("-").map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}
