import { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import { downloadIcs } from "@shared/ics.js";
import { formatDateLong, formatDateTime, formatTime, todayKey } from "@shared/time.js";
import { toast } from "../Toast.jsx";
import Shell from "../Shell.jsx";
import DateSheet from "../DateSheet.jsx";
import Sheet, { ConfirmSheet, Segment, Skeleton } from "../Sheet.jsx";

function payLabel(tr, status) {
  if (status === "paid") return tr("paid");
  if (status === "failed") return tr("failed");
  return tr("unpaid");
}

function bookError(err, tr) {
  if (err.message === "taken") return tr("takenDetail");
  if (err.message === "past_slot") return tr("pastSlot");
  if (err.message === "not_available") return tr("notAvail");
  return tr("error");
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
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState(null);
  const [meList, setMeList] = useState("upcoming");
  const [profile, setProfile] = useState(user);
  const [form, setForm] = useState({ name: user.name, phone: user.phone || "", city: user.city || "" });

  async function load() {
    const [s, b, r] = await Promise.all([api.slots(), api.bookings(), api.reminders()]);
    setSlots(s.slots);
    setBookings(b.bookings);
    setReminders(r.banners);
    setLoading(false);
  }

  useEffect(() => {
    setProfile(user);
    setForm({ name: user.name, phone: user.phone || "", city: user.city || "" });
  }, [user]);

  useEffect(() => {
    load().catch(() => {
      toast(tr("error"), "err");
      setLoading(false);
    });
  }, []);

  const availableKeys = useMemo(() => new Set(slots.map((s) => s.dateKey)), [slots]);
  const daySlots = day ? slots.filter((s) => s.dateKey === day) : [];
  const visible = bookings.filter((b) => b.status === "confirmed");
  const upcoming = visible
    .filter((b) => new Date(b.start) > new Date())
    .sort((a, b) => new Date(a.start) - new Date(b.start));
  const past = visible
    .filter((b) => new Date(b.start) <= new Date())
    .sort((a, b) => new Date(b.start) - new Date(a.start));
  const next = upcoming[0];
  const meRows = meList === "upcoming" ? upcoming : past;

  async function confirmBook() {
    if (!pick) return;
    setBusy(true);
    try {
      const { booking } = await api.book(pick.start);
      setSlots((cur) => cur.filter((s) => s.start !== pick.start));
      setBookings((cur) => [...cur, booking]);
      setPick(null);
      setSheet(null);
      toast(tr("success"));
      setTab("home");
      load();
    } catch (err) {
      toast(bookError(err, tr), "err");
      setPick(null);
      load();
    } finally {
      setBusy(false);
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

  async function pay(id) {
    setBusy(true);
    try {
      const key = `pay_${id}_${profile.id}`;
      const result = await api.demoPay(id, key);
      setBookings((cur) => cur.map((b) => (b.id === id ? result.booking : b)));
      setSheet(null);
      toast(tr("success"));
      load();
    } catch {
      toast(tr("failed"), "err");
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile() {
    setBusy(true);
    try {
      const result = await api.updateMe(form);
      setProfile(result.user);
      setSheet(null);
      toast(tr("saved"));
    } catch {
      toast(tr("error"), "err");
    } finally {
      setBusy(false);
    }
  }

  const tabs = [
    { id: "home", icon: "home", label: tr("home") },
    { id: "book", icon: "book", label: tr("book") },
    { id: "me", icon: "me", label: tr("me") },
  ];
  const titles = { home: tr("nextSession"), book: tr("book"), me: tr("me") };
  const who = (b) => (lang === "he" ? b.provider?.name : b.provider?.nameEn || b.provider?.name);

  return (
    <Shell
      title={titles[tab]}
      action={action}
      tabs={tabs}
      tab={tab}
      onTab={setTab}
      overlay={
        <>
          {sheet?.kind === "date" ? (
            <DateSheet
              lang={lang}
              tr={tr}
              selected={day || todayKey()}
              availableKeys={availableKeys}
              onPick={(key) => {
                setDay(key);
                setPick(null);
                api.slots(key).then((s) => {
                  setSlots((cur) => {
                    const rest = cur.filter((x) => x.dateKey !== key);
                    return rest.concat(s.slots);
                  });
                });
              }}
              onClose={() => setSheet(null)}
            />
          ) : null}

          {sheet?.kind === "book" && pick ? (
            <ConfirmSheet
              title={tr("confirmBookTitle")}
              body={`${formatDateLong(day, lang)} · ${formatTime(pick.start)} · ${tr("bookWith")}`}
              confirm={tr("confirmBook")}
              cancel={tr("close")}
              busy={busy}
              onConfirm={confirmBook}
              onClose={() => setSheet(null)}
            />
          ) : null}

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

          {sheet?.kind === "pay" ? (
            <Sheet title={tr("payTitle")} onClose={() => setSheet(null)}>
              <p className="lede">{tr("payBody")}</p>
              <div className="demo-pay-card">
                <span className="pay">{tr("demoBadge")}</span>
                <strong>₪0</strong>
                <span className="meta">{tr("demoPayNote")}</span>
              </div>
              <button className="btn full" type="button" disabled={busy} onClick={() => pay(sheet.booking.id)}>
                {tr("payConfirm")}
              </button>
            </Sheet>
          ) : null}

          {sheet?.kind === "profile" ? (
            <Sheet title={tr("editProfile")} onClose={() => setSheet(null)}>
              <form
                className="stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveProfile();
                }}
              >
                <label>
                  {tr("name")}
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </label>
                <label>
                  {tr("phone")}
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="tel" />
                </label>
                <label>
                  {tr("city")}
                  <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </label>
                <button className="btn full" disabled={busy} type="submit">
                  {tr("save")}
                </button>
              </form>
            </Sheet>
          ) : null}
        </>
      }
    >
      {loading ? <Skeleton rows={4} /> : null}

      {!loading && tab === "home" ? (
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
                  {tr("withCoach")} {who(next)}
                </div>
                <div className="hero-actions">
                  <button className="btn tiny light" type="button" onClick={() => setSheet({ kind: "cancel", booking: next })}>
                    {tr("cancel")}
                  </button>
                  {next.paymentStatus !== "paid" ? (
                    <button className="btn tiny light" type="button" onClick={() => setSheet({ kind: "pay", booking: next })}>
                      {tr("payDemo")}
                    </button>
                  ) : (
                    <span className="pay">{tr("paid")}</span>
                  )}
                </div>
              </>
            ) : (
              <h2>{tr("noNext")}</h2>
            )}
          </section>
          {!next ? <div className="empty">{tr("emptyHome")}</div> : null}
          {upcoming.length > 1 ? (
            <div className="list">
              {upcoming.slice(1, 4).map((b) => (
                <div className="item" key={b.id}>
                  <div>
                    <h4>{formatDateTime(b.start, lang)}</h4>
                    <div className="meta">{who(b)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {!loading && tab === "book" ? (
        <div className="pane stack">
          <button
            className="date-trigger"
            type="button"
            onClick={() => setSheet({ kind: "date" })}
          >
            <span>
              <div className="kicker-ink">{tr("pickDate")}</div>
              {day ? formatDateLong(day, lang) : tr("pickDateCta")}
            </span>
            <span className="chev">{lang === "he" ? "‹" : "›"}</span>
          </button>

          {day ? (
            <>
              <div className="section-label">{tr("freeToday")}</div>
              {daySlots.length === 0 ? <div className="empty">{tr("emptyDaySlots")}</div> : null}
              <div className="time-grid">
                {daySlots.map((s) => (
                  <button
                    key={s.start}
                    type="button"
                    className={`time-chip ${pick?.start === s.start ? "on" : ""}`}
                    onClick={() => setPick(s)}
                  >
                    {formatTime(s.start)}
                  </button>
                ))}
              </div>
              <button
                className="btn full"
                type="button"
                disabled={!pick || busy}
                onClick={() => setSheet({ kind: "book" })}
              >
                {tr("confirmBook")}
                {pick ? ` · ${formatTime(pick.start)}` : ""}
              </button>
            </>
          ) : (
            <div className="empty">{tr("pickDateFirst")}</div>
          )}
          <p className="meta">{tr("calLater")}</p>
        </div>
      ) : null}

      {!loading && tab === "me" ? (
        <div className="pane">
          <p className="profile-name">{lang === "he" ? profile.name : profile.nameEn || profile.name}</p>
          <p className="meta">{profile.email}</p>
          <p className="meta">
            {profile.phone || tr("noPhone")}
            {profile.city ? ` · ${lang === "he" ? profile.city : profile.cityEn || profile.city}` : ""}
          </p>
          <button
            className="ghost"
            type="button"
            onClick={() => {
              setForm({ name: profile.name, phone: profile.phone || "", city: profile.city || "" });
              setSheet({ kind: "profile" });
            }}
          >
            {tr("editProfile")}
          </button>

          <div className="section-label">{tr("myBookings")}</div>
          <Segment
            value={meList}
            onChange={setMeList}
            options={[
              { id: "upcoming", label: tr("upcoming") },
              { id: "past", label: tr("past") },
            ]}
          />
          {meRows.length === 0 ? (
            <div className="empty">{meList === "upcoming" ? tr("emptyBookings") : tr("emptyPast")}</div>
          ) : null}
          <div className="list">
            {meRows.map((b) => (
              <div className="item col" key={b.id}>
                <div className="item-main">
                  <div>
                    <h4>{formatDateTime(b.start, lang)}</h4>
                    <div className="meta">{who(b)}</div>
                  </div>
                  <span className={`pay ${b.paymentStatus === "paid" ? "" : "unpaid"}`}>{payLabel(tr, b.paymentStatus)}</span>
                </div>
                {meList === "upcoming" ? (
                  <div className="row">
                    {b.paymentStatus !== "paid" ? (
                      <button className="btn tiny" type="button" onClick={() => setSheet({ kind: "pay", booking: b })}>
                        {tr("payDemo")}
                      </button>
                    ) : null}
                    <button className="btn tiny" type="button" onClick={() => downloadIcs(b)}>
                      {tr("addToCal")}
                    </button>
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
                    <button className="btn tiny" type="button" onClick={() => setSheet({ kind: "cancel", booking: b })}>
                      {tr("cancel")}
                    </button>
                  </div>
                ) : null}
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
