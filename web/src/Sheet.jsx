export default function Sheet({ title, onClose, children, wide }) {
  return (
    <div className="sheet-root" role="dialog" aria-modal="true" aria-label={title || "sheet"}>
      <button className="sheet-backdrop" type="button" aria-label="close" onClick={onClose} />
      <div className={`sheet ${wide ? "wide" : ""}`}>
        <div className="sheet-grab" />
        {title ? <div className="sheet-title">{title}</div> : null}
        {children}
      </div>
    </div>
  );
}

export function ConfirmSheet({ title, body, confirm, cancel, danger, busy, onConfirm, onClose }) {
  return (
    <Sheet title={title} onClose={onClose}>
      {body ? <p className="lede">{body}</p> : null}
      <div className="stack">
        <button className={`btn full ${danger ? "danger" : ""}`} type="button" disabled={busy} onClick={onConfirm}>
          {confirm}
        </button>
        <button className="btn secondary full" type="button" disabled={busy} onClick={onClose}>
          {cancel}
        </button>
      </div>
    </Sheet>
  );
}

export function Segment({ value, onChange, options }) {
  return (
    <div className="segment" role="tablist">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="tab"
          aria-selected={value === opt.id}
          className={value === opt.id ? "on" : ""}
          onClick={() => onChange(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function Skeleton({ rows = 3 }) {
  return (
    <div className="skel-list" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div className="skel" key={i} />
      ))}
    </div>
  );
}
