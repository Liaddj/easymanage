import { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import { dateKey, formatDate, formatDateTime, formatTime } from "@shared/time.js";

export default function Client({ lang, tr }) {
  const [tab, setTab] = useState("book");
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [day, setDay] = useState("");
  const [pick, setPick] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const [s, b, r] = await Promise.all([api.slots(), api.bookings(), api.reminders()]);
    setSlots(s.slots);
    setBookings(b.bookings);
    setReminders(r.banners);
    if (!day && s.slots[0]) setDay(s.slots[0].dateKey);
  }

  useEffect(() => {
    load().catch(() => setError(tr("error")));
  }, []);

  const days = useMemo(() => {
    const map = new Map();
    for (const s of slots) {
      if (!map.has(s.dateKey)) map.set(s.dateKey, []);
      map.get(s.dateKey).push(s);
    }
    return [...map.entries()];
  }, [slots]);

  const daySlots = slots.filter((s) => s.dateKey === day);
  const next = bookings
    .filter((b) => b.status === "confirmed" && new Date(b.start) > new Date())
    .sort((a, b) => new Date(a.start) - new Date(b.start))[0];

  async function confirm() {
    if (!pick) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.book(pick.start);
      setPick(null);
      setMessage(tr("booked"));
      await load();
      setTab("bookings");
    } catch (err) {
      setError(err.message === "taken" ? tr("taken") : tr("error"));
    } finally {
      setBusy(false);
    }
  }

  async function cancel(id) {
    await api.cancel(id);
    await load();
  }

  return (
    <div className="stack">
      {reminders.map((r) => (
        <div className="warn" key={r.id}>
          {tr("reminderSoon")} · {formatDateTime(r.booking.start, lang)}
        </div>
      ))}

      <section className="card next-card">
        <div className="meta">{tr("nextSession")}</div>
        {next ? (
          <>
            <h2>{formatDateTime(next.start, lang)}</h2>
            <div>
              {lang === "he" ? next.provider?.name : next.provider?.nameEn} ·{" "}
              {lang === "he" ? next.provider?.specialty : next.provider?.specialtyEn}
            </div>
          </>
        ) : (
          <h2>{tr("noNext")}</h2>
        )}
      </section>

      <div className="tabs">
        <button type="button" className={tab === "book" ? "on" : ""} onClick={() => setTab("book")}>
          {tr("book")}
        </button>
        <button type="button" className={tab === "bookings" ? "on" : ""} onClick={() => setTab("bookings")}>
          {tr("myBookings")}
        </button>
      </div>

      {tab === "book" ? (
        <section className="card stack">
          <div>
            <h2 style={{ margin: "0 0 10px" }}>{tr("pickDay")}</h2>
            <div className="chip-row">
              {days.map(([key, rows]) => (
                <button
                  key={key}
                  type="button"
                  className={`chip ${day === key ? "on" : ""}`}
                  onClick={() => {
                    setDay(key);
                    setPick(null);
                  }}
                >
                  {formatDate(rows[0].start, lang)}
                </button>
              ))}
            </div>
            {days.length === 0 ? <p className="meta">{tr("emptySlots")}</p> : null}
          </div>
          <div>
            <h2 style={{ margin: "0 0 10px" }}>{tr("pickTime")}</h2>
            <div className="chip-row">
              {daySlots.map((s) => (
                <button
                  key={s.start}
                  type="button"
                  className={`chip ${pick?.start === s.start ? "on" : ""}`}
                  onClick={() => setPick(s)}
                >
                  {formatTime(s.start)}
                </button>
              ))}
            </div>
          </div>
          {error ? <p className="error">{error}</p> : null}
          {message ? <p className="note">{message}</p> : null}
          <button className="btn full" type="button" disabled={!pick || busy} onClick={confirm}>
            {tr("confirmBook")}
            {pick ? ` · ${formatDate(pick.start, lang)} ${formatTime(pick.start)}` : ""}
          </button>
          <p className="note">{tr("calNote")}</p>
        </section>
      ) : (
        <section className="card">
          {bookings.length === 0 ? <p className="meta">{tr("emptyBookings")}</p> : null}
          <div className="list">
            {bookings.map((b) => (
              <div className="item" key={b.id}>
                <div>
                  <h4>{formatDateTime(b.start, lang)}</h4>
                  <div className="meta">
                    {lang === "he" ? b.provider?.name : b.provider?.nameEn} · {dateKey(new Date(b.start))}
                  </div>
                </div>
                <div className="row">
                  <span className={`badge ${b.status === "cancelled" ? "gone" : ""}`}>
                    {b.status === "cancelled" ? tr("cancelled") : tr("confirmed")}
                  </span>
                  {b.status === "confirmed" && new Date(b.start) > new Date() ? (
                    <button className="btn tiny danger" type="button" onClick={() => cancel(b.id)}>
                      {tr("cancel")}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
