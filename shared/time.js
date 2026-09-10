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
