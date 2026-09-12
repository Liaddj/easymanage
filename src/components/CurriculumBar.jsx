import { pick } from "../i18n.js";

export default function CurriculumBar({
  lang,
  t,
  stages,
  stage,
  puzzle,
  progress,
  stageProgress,
  overallProgress,
  onOpen,
}) {
  return (
    <div className="glass-panel flex shrink-0 flex-col gap-1.5 rounded-2xl px-2 py-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[11px] font-semibold text-white/85">
          {pick(lang, stage.title)}
          <span className="mx-1 text-white/25">·</span>
          <span className="text-cyan-200/80">
            {stageProgress.solved}/{stageProgress.total}
          </span>
        </p>
        <p className="shrink-0 text-[10px] text-white/40">
          {t("pathProgress")} {overallProgress.solved}/{overallProgress.total}
        </p>
      </div>
      <div className="slim-scroll flex gap-1 overflow-x-auto pb-0.5">
        {stages.map((item) => {
          const active = item.id === stage.id;
          const solved = item.puzzles.filter((p) => progress.puzzles[p.id]?.solved).length;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpen(item.id, item.puzzles[0].id)}
              aria-current={active ? "step" : undefined}
              className={`shrink-0 whitespace-nowrap rounded-lg px-2 py-1 text-[10px] font-semibold ${
                active ? "bg-cyan-400/18 text-cyan-50" : "bg-white/[0.04] text-white/55"
              }`}
            >
              {pick(lang, item.title)}
              <span className="ms-1 text-white/35">
                {solved}/{item.puzzles.length}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex gap-1 overflow-x-auto">
        {stage.puzzles.map((item, index) => {
          const done = Boolean(progress.puzzles[item.id]?.solved);
          const active = item.id === puzzle.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpen(stage.id, item.id)}
              aria-label={`${index + 1}. ${pick(lang, item.title)}`}
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-md text-[10px] font-bold ${
                active
                  ? "bg-cyan-400/25 text-cyan-50 ring-1 ring-cyan-300/50"
                  : done
                    ? "bg-emerald-400/20 text-emerald-100"
                    : "bg-white/5 text-white/45"
              }`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
