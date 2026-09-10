import { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import { formatDateTime, weekdayName } from "@shared/time.js";
import { toast } from "../Toast.jsx";
import Shell from "../Shell.jsx";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);
const DAYS = [0, 1, 2, 3, 4, 5, 6];

export default function Provider({ lang, tr, user, action, onLogout }) {
  const [tab, setTab] = useState("today");
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [clients, setClients] = useState([]);
  const [invite, setInvite] = useState(null);
  const [reminders, setReminders] = useState({ banners: [], log: [] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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
      const [a, b, c, r, inv] = await Promise.all([
        api.availability(),
        api.bookings(),
        api.clients(),
        api.reminders(),
        api.invite(),
      ]);
      setSlots(a.slots);
      setBookings(b.bookings);
      setClients(c.clients);
      setReminders(r);
      setInvite(inv);
    } catch {
      setError(tr("error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(weekday, hour) {
    const keyMatch = (s) => s.weekday === weekday && s.hour === hour;
    const exists = slots.some(keyMatch);
    setSlots((cur) => (exists ? cur.filter((s) => !keyMatch(s)) : cur.concat([{ weekday, hour }])));
    toast(exists ? tr("hourClosed") : tr("hourOpen"), exists ? "gone" : "ok");
    try {
      const next = await api.toggleAvailability(weekday, hour);
      setSlots(next.slots);
    } catch {
      load();
    }
  }

  async function cancel(id) {
    setBookings((cur) => cur.filter((b) => b.id !== id));
    toast(tr("removed"), "gone");
    try {
      await api.cancel(id);
    } catch {
      load();
    }
  }

  const upcoming = bookings.filter((b) => b.status === "confirmed" && new Date(b.start) > new Date());

  const tabs = [
    { id: "today", icon: "today", label: tr("today") },
    { id: "availability", icon: "hours", label: tr("availability") },
    { id: "clients", icon: "clients", label: tr("clients") },
    { id: "me", icon: "me", label: tr("me") },
  ];
  const titles = {
    today: tr("today"),
    availability: tr("week"),
    clients: tr("clients"),
    me: tr("me"),
  };

  function inviteUrl() {
    const base = `${window.location.origin}${window.location.pathname}`;
    return `${base}#/join/${invite?.code || "FLOWNOA"}`;
  }

  return (
    <Shell title={titles[tab]} action={action} tabs={tabs} tab={tab} onTab={setTab}>
      {error ? <p className="error">{error}</p> : null}
      {loading ? <p className="loading">…</p> : null}

      {tab === "today" ? (
        <div className="pane">
          {reminders.banners[0] ? (
            <div className="warn" style={{ marginBottom: 12 }}>
              {tr("reminderSoon")} · {lang === "he" ? reminders.banners[0].booking.client?.name : reminders.banners[0].booking.client?.nameEn}
            </div>
          ) : null}
          {upcoming.length === 0 ? <div className="empty">{tr("emptyBookings")}</div> : null}
          <div className="list">
            {upcoming.map((b) => (
              <div className="item" key={b.id}>
                <div>
                  <h4>{lang === "he" ? b.client?.name : b.client?.nameEn || b.client?.name}</h4>
                  <div className="meta">
                    {formatDateTime(b.start, lang)} ·{" "}
                    <span className={`pay ${b.paymentStatus === "paid" ? "" : "unpaid"}`}>
                      {b.paymentStatus === "paid" ? tr("paid") : tr("unpaid")}
                    </span>
                  </div>
                </div>
                <button className="btn tiny" type="button" onClick={() => cancel(b.id)}>
                  {tr("cancel")}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === "availability" ? (
        <div className="pane stack">
          <p className="meta">{tr("clickToggle")}</p>
          <div className="grid-week">
            <div />
            {DAYS.map((d) => (
              <div className="hd" key={d}>
                {weekdayName(d, lang).slice(0, lang === "he" ? 1 : 2)}
              </div>
            ))}
            {HOURS.map((hour) => (
              <HourRow key={hour} hour={hour} availSet={availSet} busyHours={busyHours} onToggle={toggle} />
            ))}
          </div>
          <div className="legend">
            <span><i className="open" />{tr("open")}</span>
            <span><i className="closed" />{tr("closed")}</span>
            <span><i className="taken" />{tr("takenSlot")}</span>
          </div>
        </div>
      ) : null}

      {tab === "clients" ? (
        <div className="pane">
          <div className="card stack">
            <div className="section-label" style={{ marginTop: 0 }}>{tr("invite")}</div>
            <p className="meta">{tr("inviteHint")}</p>
            <div className="code">{invite?.code || "—"}</div>
            <button
              className="btn secondary full"
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(inviteUrl());
                  toast(tr("copied"));
                } catch {
                  toast(inviteUrl());
                }
              }}
            >
              {tr("copyLink")}
            </button>
          </div>
          {clients.length === 0 ? <div className="empty" style={{ marginTop: 14 }}>{tr("emptyInvite")}</div> : null}
          <div className="list">
            {clients.map((row) => (
              <div className="item" key={row.client.id}>
                <div>
                  <h3>{lang === "he" ? row.client.name : row.client.nameEn || row.client.name}</h3>
                  <div className="meta">
                    {row.upcoming ? formatDateTime(row.upcoming.start, lang) : "—"}
                    {row.upcoming ? ` · ${row.upcoming.paymentStatus === "paid" ? tr("paid") : tr("unpaid")}` : ""}
                  </div>
                </div>
                <span className="badge">{row.total}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === "me" ? (
        <div className="pane">
          <p className="profile-name">{lang === "he" ? user.name : user.nameEn || user.name}</p>
          <p className="meta">{user.email}</p>
          <p className="meta" style={{ marginTop: 8 }}>{tr("calLater")}</p>
          <div className="section-label">{tr("reminderLog")}</div>
          {reminders.log.length === 0 ? <p className="meta">{tr("noReminders")}</p> : null}
          <div className="list">
            {reminders.log.map((row) => (
              <div className="item" key={row.id}>
                <div>
                  <h4>{tr("reminder")}</h4>
                  <div className="meta">{formatDateTime(row.at, lang)}</div>
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

function HourRow({ hour, availSet, busyHours, onToggle }) {
  const label = `${String(hour).padStart(2, "0")}`;
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
