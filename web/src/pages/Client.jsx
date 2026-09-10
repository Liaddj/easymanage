import { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import { downloadIcs } from "@shared/ics.js";
import { formatDate, formatDateTime, formatTime } from "@shared/time.js";
import { toast } from "../Toast.jsx";
import Shell from "../Shell.jsx";

function payLabel(tr, status) {
  if (status === "paid") return tr("paid");
  if (status === "failed") return tr("failed");
  return tr("unpaid");
}

function scheduleLocalReminder(booking, tr) {
  const ms = new Date(booking.start).getTime() - Date.now() - 30 * 60 * 1000;
  if (ms < 500 || ms > 24 * 3600 * 1000) return;
  if (!("Notification" in window)) return;
  const fire = () => new Notification(tr("reminder"), { body: formatDateTime(booking.start) });
  if (Notification.permission === "granted") setTimeout(fire, ms);
}

export default function Client({ lang, tr, user, action, onLogout }) {
  const [tab, setTab] = useState("home");
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [day, setDay] = useState("");
  const [pick, setPick] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [s, b, r] = await Promise.all([api.slots(), api.bookings(), api.reminders()]);
    setSlots(s.slots);
    setBookings(b.bookings);
    setReminders(r.banners);
    if (!day && s.slots[0]) setDay(s.slots[0].dateKey);
    setLoading(false);
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
  const visible = bookings.filter((b) => b.status === "confirmed");
  const upcoming = visible
    .filter((b) => new Date(b.start) > new Date())
    .sort((a, b) => new Date(a.start) - new Date(b.start));
  const next = upcoming[0];

  async function confirm() {
    if (!pick) return;
    setBusy(true);
    setError("");
    try {
      const { booking } = await api.book(pick.start);
      setSlots((cur) => cur.filter((s) => s.start !== pick.start));
      setBookings((cur) => [...cur, booking]);
      setPick(null);
      toast(tr("added"));
      setTab("home");
      load();
    } catch (err) {
      setError(err.message === "taken" ? tr("taken") : tr("error"));
    } finally {
      setBusy(false);
    }
  }

  async function cancel(id) {
    setBookings((cur) => cur.filter((b) => b.id !== id));
    toast(tr("removed"), "gone");
    try {
      await api.cancel(id);
      load();
    } catch {
      load();
    }
  }

  async function pay(id) {
    try {
      const key = `pay_${id}_${user.id}`;
      const result = await api.demoPay(id, key);
      setBookings((cur) => cur.map((b) => (b.id === id ? result.booking : b)));
      toast(tr("paid"));
      load();
    } catch {
      toast(tr("failed"), "gone");
    }
  }

  const tabs = [
    { id: "home", icon: "home", label: tr("home") },
    { id: "book", icon: "book", label: tr("book") },
    { id: "me", icon: "me", label: tr("me") },
  ];
  const titles = { home: tr("nextSession"), book: tr("book"), me: tr("me") };

  return (
    <Shell title={titles[tab]} action={action} tabs={tabs} tab={tab} onTab={setTab}>
      {loading ? <p className="loading">…</p> : null}

      {tab === "home" ? (
        <div className="pane stack">
          {reminders[0] ? (
            <div className="warn">
              {tr("reminderSoon")} · {formatDateTime(reminders[0].booking.start, lang)}
            </div>
          ) : null}
          <section className="hero-next">
            <div className="kicker">{tr("nextSession")}</div>
            {next ? (
              <>
                <h2>{formatDateTime(next.start, lang)}</h2>
                <div className="who">
                  {tr("withCoach")} {lang === "he" ? next.provider?.name : next.provider?.nameEn}
                </div>
              </>
            ) : (
              <h2>{tr("noNext")}</h2>
            )}
          </section>
          {!next ? <div className="empty">{tr("emptyHome")}</div> : null}
          {upcoming.length > 1 ? (
            <div className="list">
              {upcoming.slice(1).map((b) => (
                <div className="item" key={b.id}>
                  <div>
                    <h4>{formatDateTime(b.start, lang)}</h4>
                    <div className="meta">{lang === "he" ? b.provider?.name : b.provider?.nameEn}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "book" ? (
        <div className="pane">
          <div className="section-label">{tr("pickDay")}</div>
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
          {days.length === 0 ? <div className="empty">{tr("emptySlots")}</div> : null}

          <div className="section-label">{tr("pickTime")}</div>
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
          {error ? <p className="error">{error}</p> : null}
          <button className="btn full" type="button" disabled={!pick || busy} onClick={confirm} style={{ marginTop: 12 }}>
            {tr("confirmBook")}
            {pick ? ` · ${formatTime(pick.start)}` : ""}
          </button>
          <p className="meta" style={{ marginTop: 14 }}>
            {tr("calLater")}
          </p>
        </div>
      ) : null}

      {tab === "me" ? (
        <div className="pane">
          <p className="profile-name">{lang === "he" ? user.name : user.nameEn || user.name}</p>
          <p className="meta">{user.email}</p>
          <div className="section-label">{tr("myBookings")}</div>
          {visible.length === 0 ? <div className="empty">{tr("emptyBookings")}</div> : null}
          <div className="list">
            {visible.map((b) => (
              <div className="item" key={b.id}>
                <div>
                  <h4>{formatDateTime(b.start, lang)}</h4>
                  <div className="meta">
                    <span className={`pay ${b.paymentStatus === "paid" ? "" : "unpaid"}`}>{payLabel(tr, b.paymentStatus)}</span>
                  </div>
                </div>
                <div className="row">
                  {new Date(b.start) > new Date() && b.paymentStatus !== "paid" ? (
                    <button className="btn tiny" type="button" onClick={() => pay(b.id)}>
                      {tr("payDemo")}
                    </button>
                  ) : null}
                  {new Date(b.start) > new Date() ? (
                    <button className="btn tiny" type="button" onClick={() => downloadIcs(b)}>
                      {tr("addToCal")}
                    </button>
                  ) : null}
                  {new Date(b.start) > new Date() ? (
                    <button
                      className="btn tiny"
                      type="button"
                      onClick={async () => {
                        if ("Notification" in window && Notification.permission !== "granted") {
                          await Notification.requestPermission();
                        }
                        scheduleLocalReminder(b, tr);
                        toast(tr("remindOn"));
                      }}
                    >
                      {tr("remindMe")}
                    </button>
                  ) : null}
                  {new Date(b.start) > new Date() ? (
                    <button className="btn tiny" type="button" onClick={() => cancel(b.id)}>
                      {tr("cancel")}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <div className="hairline" />
          <button className="ghost" type="button" onClick={onLogout}>
            {tr("logout")}
          </button>
        </div>
      ) : null}
    </Shell>
  );
}
