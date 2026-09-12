import { pick } from "../i18n.js";

export default function PuzzleGoal({ lang, t, stage, puzzle, puzzleState, onRetry, onNext, onPlayComputer }) {
  const failed = puzzleState === "fail";
  const success = puzzleState === "success";
  const pathDone = puzzleState === "pathDone";

  let title = pick(lang, puzzle.title);
  let body = pick(lang, puzzle.goal);
  if (failed) {
    title = t("puzzleFail");
    body = pick(lang, puzzle.fail);
  } else if (success) {
    title = t("puzzleSuccess");
    body = pick(lang, puzzle.success);
  } else if (pathDone) {
    title = t("pathComplete");
    body = t("pathCompleteBody");
  }

  return (
    <section
      className={`glass-panel rounded-2xl px-3 py-2 ${
        failed ? "border-rose-300/30" : success || pathDone ? "border-emerald-300/30" : ""
      }`}
      aria-live="polite"
    >
      <p className="text-[10px] font-semibold tracking-[0.16em] text-white/40 uppercase">
        {pick(lang, stage.goal)}
      </p>
      <h3 className="mt-0.5 text-sm font-semibold text-white">{title}</h3>
      <p className="mt-0.5 line-clamp-3 text-xs leading-relaxed text-white/65">{body}</p>
      {failed || success || pathDone ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {failed ? (
            <button
              type="button"
              onClick={onRetry}
              className="glow-cyan min-h-9 rounded-xl border border-cyan-300/25 bg-cyan-400/10 px-3 text-xs font-semibold text-cyan-50"
            >
              {t("retry")}
            </button>
          ) : null}
          {success ? (
            <button
              type="button"
              onClick={onNext}
              className="glow-violet min-h-9 rounded-xl border border-violet-300/30 bg-violet-400/10 px-3 text-xs font-semibold text-violet-50"
            >
              {t("nextPuzzle")}
            </button>
          ) : null}
          {pathDone ? (
            <button
              type="button"
              onClick={onPlayComputer}
              className="glow-cyan min-h-9 rounded-xl border border-cyan-300/25 bg-cyan-400/10 px-3 text-xs font-semibold text-cyan-50"
            >
              {t("modeComputer")}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
