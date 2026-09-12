import { UNICODE } from "../lib/board.js";

export default function CapturedPieces({ taken, material, t }) {
  const advantage =
    material === 0 ? "" : material > 0 ? `+${material}` : `${material}`;

  return (
    <div className="flex items-center justify-between gap-2 px-1 text-sm">
      <div className="min-w-0 truncate text-white/70" title={t("captured")}>
        <span className="tracking-tight">{taken.b.map((p, i) => <span key={`b${i}`}>{UNICODE.b[p.type]}</span>)}</span>
        <span className="mx-1 text-white/20">|</span>
        <span className="tracking-tight">{taken.w.map((p, i) => <span key={`w${i}`}>{UNICODE.w[p.type]}</span>)}</span>
      </div>
      <span className="shrink-0 font-mono text-[11px] text-cyan-200/80">
        {t("material")} {advantage || "0"}
      </span>
    </div>
  );
}
