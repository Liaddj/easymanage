import { pick } from "../i18n.js";
import { dashboardRows } from "../lib/progress.js";

const STATUS_CLASS = {
  complete: "text-emerald-200",
  in_progress: "text-cyan-200",
  ready: "text-white/70",
  locked: "text-white/35",
};

export default function ProgressDashboard({ lang, t, stages, progress, currentStageId, onOpen }) {
  const rows = dashboardRows(stages, progress, currentStageId);
  const solved = rows.reduce((sum, row) => sum + row.solved, 0);
  const total = rows.reduce((sum, row) => sum + row.total, 0);
  const percent = total === 0 ? 0 : Math.round((solved / total) * 100);

  return (
    <section className="glass-panel shrink-0 overflow-hidden rounded-2xl" aria-label={t("progressTitle")}>
      <div className="flex items-center justify-between gap-2 border-b border-white/5 px-3 py-2">
        <h2 className="font-display text-[11px] tracking-[0.18em] text-white/70 uppercase">{t("progressTitle")}</h2>
        <p className="text-[11px] font-semibold text-cyan-100">
          {percent}% · {solved}/{total}
        </p>
      </div>
      <div className="h-1 bg-black/40">
        <div className="h-full bg-gradient-to-r from-violet-400 to-cyan-300" style={{ width: `${percent}%` }} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[18rem] text-left text-[11px]">
          <thead className="text-white/40">
            <tr>
              <th className="px-3 py-1.5 font-medium">{t("stageCol")}</th>
              <th className="px-2 py-1.5 font-medium">{t("statusCol")}</th>
              <th className="px-2 py-1.5 font-medium">{t("drillsCol")}</th>
              <th className="px-3 py-1.5 font-medium">{t("scoreCol")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const active = row.id === currentStageId;
              return (
                <tr key={row.id} className={active ? "bg-cyan-400/10" : ""}>
                  <td className="px-3 py-1.5">
                    <button
                      type="button"
                      onClick={() => row.unlocked && onOpen(row.id)}
                      disabled={!row.unlocked}
                      className={`text-start font-semibold ${row.unlocked ? "text-white" : "text-white/35"}`}
                    >
                      {row.unlocked ? "" : "🔒 "}
                      {pick(lang, row.title)}
                    </button>
                  </td>
                  <td className={`px-2 py-1.5 font-semibold ${STATUS_CLASS[row.status]}`}>
                    {t(`status_${row.status}`)}
                  </td>
                  <td className="px-2 py-1.5 font-mono text-white/70">
                    <span className="me-1.5">
                      {row.solved}/{row.total}
                    </span>
                    {row.checks.map((done, i) => (
                      <span key={`${row.id}-${i}`} className={done ? "text-emerald-300" : "text-white/20"}>
                        {done ? "✓" : "○"}
                      </span>
                    ))}
                  </td>
                  <td className="px-3 py-1.5 font-mono text-cyan-100/80">{row.unlocked ? row.score : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
