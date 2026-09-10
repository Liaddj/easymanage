import { TZ, zonedParts } from "./time.js";

function pad(n) {
  return String(n).padStart(2, "0");
}

function stamp(iso) {
  const p = zonedParts(new Date(iso));
  return `${p.year}${pad(p.month)}${pad(p.day)}T${pad(p.hour)}${pad(p.minute)}00`;
}

export function bookingToIcs(booking) {
  const title = booking.provider?.name ? `אימון פלואו · ${booking.provider.name}` : "אימון פלואו";
  const desc = [booking.provider?.name, booking.client?.name].filter(Boolean).join(" · ");
  const uid = `${booking.id}@flow.local`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Flow//HE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp(booking.createdAt || booking.start)}`,
    `DTSTART;TZID=${TZ}:${stamp(booking.start)}`,
    `DTEND;TZID=${TZ}:${stamp(booking.end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${desc}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export function downloadIcs(booking) {
  const blob = new Blob([bookingToIcs(booking)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `flow-${booking.id}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
