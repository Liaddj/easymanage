import { useMemo, useState } from "react";
import { addDaysKey, monthGrid, monthTitle, shiftMonth, todayKey } from "@shared/time.js";
import Sheet from "./Sheet.jsx";

const HEADS_HE = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];
const HEADS_EN = ["S", "M", "T", "W", "T", "F", "S"];

export default function DateSheet({ lang, tr, selected, availableKeys, onPick, onClose }) {
  const today = todayKey();
  const max = addDaysKey(today, 13);
  const seed = (selected && selected >= today ? selected : today).split("-").map(Number);
  const [year, setYear] = useState(seed[0]);
  const [month, setMonth] = useState(seed[1]);

  const cells = useMemo(() => monthGrid(year, month), [year, month]);
  const heads = lang === "he" ? HEADS_HE : HEADS_EN;
  const thisMonth = today.slice(0, 7);
  const viewMonth = `${year}-${String(month).padStart(2, "0")}`;
  const maxMonth = max.slice(0, 7);
  const canPrev = viewMonth > thisMonth;
  const canNext = viewMonth < maxMonth;

  function move(delta) {
    const next = shiftMonth(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
  }

  return (
    <Sheet title={tr("pickDate")} onClose={onClose} wide>
      <div className="cal-nav">
        <button className="ghost" type="button" disabled={!canPrev} onClick={() => move(-1)}>
          {lang === "he" ? "›" : "‹"}
        </button>
        <div className="cal-month">{monthTitle(year, month, lang)}</div>
        <button className="ghost" type="button" disabled={!canNext} onClick={() => move(1)}>
          {lang === "he" ? "‹" : "›"}
        </button>
      </div>
      <div className="cal" dir="ltr">
        {heads.map((h, i) => (
          <div className="cal-head" key={`${h}-${i}`}>
            {h}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <div key={`e-${i}`} />;
          const open = availableKeys.has(cell.key);
          const inWindow = cell.key >= today && cell.key <= max;
          const on = selected === cell.key;
          const isToday = cell.key === today;
          return (
            <button
              key={cell.key}
              type="button"
              disabled={!inWindow}
              className={`cal-day ${on ? "on" : ""} ${isToday ? "today" : ""} ${open ? "open" : ""}`}
              onClick={() => {
                onPick(cell.key);
                onClose();
              }}
            >
              {cell.day}
              {open ? <i /> : null}
            </button>
          );
        })}
      </div>
      <p className="meta" style={{ marginTop: 10 }}>
        {tr("hasOpen")}
      </p>
    </Sheet>
  );
}
