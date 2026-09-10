import { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import { formatDateTime, weekdayName } from "@shared/time.js";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);
const DAYS = [0, 1, 2, 3, 4, 5, 6];

export default function Provider({ lang, tr }) {
  const [tab, setTab] = useState("availability");
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [clients, setClients] = useState([]);
  const [reminders, setReminders] = useState({ banners: [], log: [] });
  const [error, setError] = useState("");

  const availSet = useMemo(() => new Set(slots.map((s) => `${s.weekday}-${s.hour}`)), [slots]);
  const busyHours = useMemo(() => {
    const set = new Set();
    for (const b of bookings.filter((x) => x.status === "confirmed")) {
      const d = new Date(b.start);
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Jerusalem",
        weekday: "short",
        hour: "2-digit",
        hourCycle: "h23",
      }).formatToParts(d);
      const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      const weekday = map[parts.find((p) => p.type === "weekday")?.value];
      const hour = Number(parts.find((p) => p.type === "hour")?.value);
      if (weekday != null) set.add(`${weekday}-${hour}`);
    }
    return set;
  }, [bookings]);

  async function load() {
    try {
      const [a, b, c, r] = await Promise.all([api.availability(), api.bookings(), api.clients(), api.reminders()]);
      setSlots(a.slots);
      setBookings(b.bookings);
      setClients(c.clients);
      setReminders(r);
    } catch {
      setError(tr("error"));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(weekday, hour) {
    setError("");
    try {
      const next = await api.toggleAvailability(weekday, hour);
      setSlots(next.slots);
    } catch {
      setError(tr("error"));
    }
  }

  async function cancel(id) {
    await api.cancel(id);
    await load();
  }

  const upcoming = bookings.filter((b) => b.status === "confirmed" && new Date(b.start) > new Date());
  const past = bookings.filter((b) => !(b.status === "confirmed" && new Date(b.start) > new Date()));

  return (
    <div>
      {reminders.banners.map((r) => (
        <div className="warn" key={r.id} style={{ marginBottom: 12 }}>
          {tr("reminderSoon")}: {lang === "he" ? r.booking.client?.name : r.booking.client?.nameEn} ·{" "}
          {formatDateTime(r.booking.start, lang)}
        </div>
      ))}
      {error ? <p className="error">{error}</p> : null}

      <div className="tabs">
        <button type="button" className={tab === "availability" ? "on" : ""} onClick={() => setTab("availability")}>
          {tr("availability")}
        </button>
        <button type="button" className={tab === "bookings" ? "on" : ""} onClick={() => setTab("bookings")}>
          {tr("bookings")}
        </button>
        <button type="button" className={tab === "clients" ? "on" : ""} onClick={() => setTab("clients")}>
          {tr("clients")}
        </button>
      </div>

      {tab === "availability" ? (
        <section className="card stack">
          <div>
            <h2 style={{ margin: "0 0 6px" }}>{tr("week")}</h2>
            <p className="meta">{tr("clickToggle")}</p>
          </div>
          <div className="grid-week">
            <div />
            {DAYS.map((d) => (
              <div className="hd" key={d}>
                {weekdayName(d, lang)}
              </div>
            ))}
            {HOURS.map((hour) => (
              <HourRow
                key={hour}
                hour={hour}
                availSet={availSet}
                busyHours={busyHours}
                onToggle={toggle}
              />
            ))}
          </div>
          <p className="note">{tr("calNote")}</p>
          <div>
            <h3 style={{ marginBottom: 8 }}>{tr("reminderLog")}</h3>
            {reminders.log.length === 0 ? <p className="meta">{tr("noReminders")}</p> : null}
            {reminders.log.map((row) => (
              <div className="item" key={row.id}>
                <div>
                  <div>{row.message}</div>
                  <div className="meta">{row.channel} · {row.at}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {tab === "bookings" ? (
        <section className="card">
          <h2>{tr("upcoming")}</h2>
          <BookingList rows={upcoming} lang={lang} tr={tr} onCancel={cancel} empty={tr("emptyBookings")} />
          <h2>{tr("past")}</h2>
          <BookingList rows={past} lang={lang} tr={tr} empty="" />
        </section>
      ) : null}

      {tab === "clients" ? (
        <section className="card">
          {clients.length === 0 ? <p className="meta">{tr("emptyClients")}</p> : null}
          <div className="list">
            {clients.map((row) => (
              <div className="item" key={row.client.id}>
                <div>
                  <h3>{lang === "he" ? row.client.name : row.client.nameEn || row.client.name}</h3>
                  <div className="meta">{row.client.email}</div>
                  <div className="meta">
                    {tr("nextVisit")}: {row.upcoming ? formatDateTime(row.upcoming.start, lang) : "—"} · {tr("lastVisit")}:{" "}
                    {row.last ? formatDateTime(row.last.start, lang) : "—"}
                  </div>
                </div>
                <span className="badge">
                  {row.total} {tr("sessions")}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function HourRow({ hour, availSet, busyHours, onToggle }) {
  const label = `${String(hour).padStart(2, "0")}:00`;
  return (
    <>
      <div className="hr">{label}</div>
      {DAYS.map((d) => {
        const key = `${d}-${hour}`;
        const on = availSet.has(key);
        const busy = busyHours.has(key);
        return (
          <button
            key={key}
            type="button"
            className={`cell ${on ? "on" : ""} ${busy ? "busy" : ""}`}
            onClick={() => onToggle(d, hour)}
            aria-label={`${label} ${d}`}
          />
        );
      })}
    </>
  );
}

function BookingList({ rows, lang, tr, onCancel, empty }) {
  if (!rows.length) return empty ? <p className="meta">{empty}</p> : null;
  return (
    <div className="list">
      {rows.map((b) => (
        <div className="item" key={b.id}>
          <div>
            <h4>{lang === "he" ? b.client?.name : b.client?.nameEn || b.client?.name}</h4>
            <div className="meta">{formatDateTime(b.start, lang)}</div>
          </div>
          <div className="row">
            <span className={`badge ${b.status === "cancelled" ? "gone" : ""}`}>
              {b.status === "cancelled" ? tr("cancelled") : tr("confirmed")}
            </span>
            {onCancel && b.status === "confirmed" && new Date(b.start) > new Date() ? (
              <button className="btn tiny danger" type="button" onClick={() => onCancel(b.id)}>
                {tr("cancel")}
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
