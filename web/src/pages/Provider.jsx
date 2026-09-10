import { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import { formatDateTime, weekdayName } from "@shared/time.js";
import { toast } from "../Toast.jsx";
import Shell from "../Shell.jsx";
import Sheet, { ConfirmSheet, Segment, Skeleton } from "../Sheet.jsx";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);
const DAYS = [0, 1, 2, 3, 4, 5, 6];

export default function Provider({ lang, tr, user, action, onLogout }) {
  const [tab, setTab] = useState("today");
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [clients, setClients] = useState([]);
  const [invite, setInvite] = useState(null);
  const [reminders, setReminders] = useState({ banners: [], log: [] });
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState(null);
  const [list, setList] = useState("upcoming");
  const [busy, setBusy] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [noteDraft, setNoteDraft] = useState("");

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
      toast(tr("error"), "err");
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
      toast(tr("error"), "err");
      load();
    }
  }

  async function cancel(id) {
    setBusy(true);
    try {
      await api.cancel(id);
      setBookings((cur) => cur.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)));
      setSheet(null);
      toast(tr("removed"), "gone");
      load();
    } catch {
      toast(tr("error"), "err");
      load();
    } finally {
      setBusy(false);
    }
  }

  async function saveClient() {
    if (!sheet?.row) return;
    setBusy(true);
    try {
      const { client } = await api.updateClient(sheet.row.client.id, {
        notes: noteDraft,
        phone: sheet.row.client.phone,
      });
      setClients((cur) => cur.map((row) => (row.client.id === client.id ? { ...row, client } : row)));
      setSheet(null);
      toast(tr("saved"));
    } catch {
      toast(tr("error"), "err");
    } finally {
      setBusy(false);
    }
  }

  async function createClient(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.addClient(addForm);
      setAddForm({ name: "", email: "", phone: "", notes: "" });
      setSheet(null);
      toast(tr("success"));
      load();
    } catch {
      toast(tr("error"), "err");
    } finally {
      setBusy(false);
    }
  }

  const confirmed = bookings.filter((b) => b.status === "confirmed");
  const upcoming = confirmed
    .filter((b) => new Date(b.start) > new Date())
    .sort((a, b) => new Date(a.start) - new Date(b.start));
  const past = confirmed
    .filter((b) => new Date(b.start) <= new Date())
    .sort((a, b) => new Date(b.start) - new Date(a.start));
  const rows = list === "upcoming" ? upcoming : past;

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

  function shareWhatsApp() {
    const coach = lang === "he" ? user.name : user.nameEn || user.name;
    const text = `${tr("inviteShare")} ${coach}: ${inviteUrl()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  const who = (b) => (lang === "he" ? b.client?.name : b.client?.nameEn || b.client?.name);

  return (
    <Shell
      title={titles[tab]}
      action={action}
      tabs={tabs}
      tab={tab}
      onTab={setTab}
      overlay={
        <>
          {sheet?.kind === "cancel" ? (
            <ConfirmSheet
              title={tr("cancelAsk")}
              body={tr("cancelBody")}
              confirm={tr("cancelYes")}
              cancel={tr("cancelNo")}
              danger
              busy={busy}
              onConfirm={() => cancel(sheet.booking.id)}
              onClose={() => setSheet(null)}
            />
          ) : null}

          {sheet?.kind === "add" ? (
            <Sheet title={tr("addClient")} onClose={() => setSheet(null)}>
              <p className="lede">{tr("addClientHint")}</p>
              <form className="stack" onSubmit={createClient}>
                <label>
                  {tr("name")}
                  <input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} required />
                </label>
                <label>
                  {tr("email")}
                  <input type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} />
                </label>
                <label>
                  {tr("phone")}
                  <input value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} inputMode="tel" />
                </label>
                <label>
                  {tr("notes")}
                  <input value={addForm.notes} onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })} />
                </label>
                <button className="btn full" disabled={busy} type="submit">
                  {tr("save")}
                </button>
              </form>
            </Sheet>
          ) : null}

          {sheet?.kind === "client" ? (
            <Sheet title={lang === "he" ? sheet.row.client.name : sheet.row.client.nameEn || sheet.row.client.name} onClose={() => setSheet(null)}>
              <p className="meta">{sheet.row.client.email}</p>
              <p className="meta">{sheet.row.client.phone || tr("noPhone")}</p>
              <p className="meta">
                {sheet.row.upcoming
                  ? `${tr("nextVisit")} · ${formatDateTime(sheet.row.upcoming.start, lang)}`
                  : sheet.row.last
                    ? `${tr("lastVisit")} · ${formatDateTime(sheet.row.last.start, lang)}`
                    : tr("emptyBookings")}
              </p>
              <label style={{ marginTop: 10 }}>
                {tr("coachNotes")}
                <input value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} />
              </label>
              <button className="btn full" type="button" disabled={busy} onClick={saveClient} style={{ marginTop: 10 }}>
                {tr("save")}
              </button>
            </Sheet>
          ) : null}
        </>
      }
    >
      {loading ? <Skeleton rows={4} /> : null}

      {!loading && tab === "today" ? (
        <div className="pane">
          {reminders.banners[0] ? (
            <div className="warn" style={{ marginBottom: 10 }}>
              {tr("reminderSoon")} · {who(reminders.banners[0].booking)}
            </div>
          ) : null}
          <Segment
            value={list}
            onChange={setList}
            options={[
              { id: "upcoming", label: tr("upcoming") },
              { id: "past", label: tr("past") },
            ]}
          />
          {rows.length === 0 ? <div className="empty">{list === "upcoming" ? tr("emptyBookings") : tr("emptyPast")}</div> : null}
          <div className="list">
            {rows.map((b) => (
              <div className="item" key={b.id}>
                <div>
                  <h4>{who(b)}</h4>
                  <div className="meta">
                    {formatDateTime(b.start, lang)} ·{" "}
                    <span className={`pay ${b.paymentStatus === "paid" ? "" : "unpaid"}`}>
                      {b.paymentStatus === "paid" ? tr("paid") : tr("unpaid")}
                    </span>
                  </div>
                </div>
                {list === "upcoming" ? (
                  <button className="btn tiny" type="button" onClick={() => setSheet({ kind: "cancel", booking: b })}>
                    {tr("cancel")}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {!loading && tab === "availability" ? (
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

      {!loading && tab === "clients" ? (
        <div className="pane">
          <div className="card stack">
            <div className="section-label" style={{ marginTop: 0 }}>{tr("invite")}</div>
            <p className="meta">{tr("inviteHint")}</p>
            <div className="code">{invite?.code || "—"}</div>
            <div className="row">
              <button
                className="btn secondary"
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
              <button className="btn secondary" type="button" onClick={shareWhatsApp}>
                {tr("shareWa")}
              </button>
            </div>
          </div>
          <div className="section-label">
            {tr("clients")} · {clients.length}
          </div>
          <button className="btn secondary full" type="button" onClick={() => setSheet({ kind: "add" })}>
            {tr("addClient")}
          </button>
          {clients.length === 0 ? <div className="empty" style={{ marginTop: 12 }}>{tr("emptyInvite")}</div> : null}
          <div className="list">
            {clients.map((row) => (
              <button
                className="item as-btn"
                type="button"
                key={row.client.id}
                onClick={() => {
                  setNoteDraft(row.client.notes || "");
                  setSheet({ kind: "client", row });
                }}
              >
                <div>
                  <h3>{lang === "he" ? row.client.name : row.client.nameEn || row.client.name}</h3>
                  <div className="meta">
                    {row.client.phone || tr("noPhone")}
                    {row.client.city ? ` · ${lang === "he" ? row.client.city : row.client.cityEn || row.client.city}` : ""}
                    {row.upcoming ? ` · ${formatDateTime(row.upcoming.start, lang)}` : ""}
                  </div>
                </div>
                <span className="badge">{row.total}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {!loading && tab === "me" ? (
        <div className="pane">
          <p className="profile-name">{lang === "he" ? user.name : user.nameEn || user.name}</p>
          <p className="meta">{user.email}</p>
          <p className="meta">
            {lang === "he" ? user.specialty : user.specialtyEn} · {lang === "he" ? user.city : user.cityEn}
          </p>
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
