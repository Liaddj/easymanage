import { motion } from "framer-motion";
import { pick } from "../i18n.js";

export default function PuzzleOverlay({ lang, t, puzzle, puzzleState, onRetry, onNext, onPlayComputer }) {
  if (puzzleState !== "fail" && puzzleState !== "success" && puzzleState !== "pathDone") return null;

  const success = puzzleState === "success" || puzzleState === "pathDone";
  const title =
    puzzleState === "pathDone" ? t("pathComplete") : success ? t("puzzleSuccess") : t("puzzleFail");
  const body =
    puzzleState === "pathDone" ? t("pathCompleteBody") : pick(lang, success ? puzzle.success : puzzle.fail);

  return (
    <motion.div
      className="absolute inset-0 z-10 grid place-items-center bg-black/50 backdrop-blur-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`glass-panel mx-3 max-w-[18rem] rounded-2xl px-4 py-4 text-center ${
          success ? "border-emerald-300/35" : "border-rose-300/35"
        }`}
        role="alertdialog"
        aria-labelledby="puzzle-result-title"
      >
        <p id="puzzle-result-title" className="font-display text-base text-white">
          {title}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-white/70">{body}</p>
        <div className="mt-3 flex justify-center gap-2">
          {puzzleState === "fail" ? (
            <button
              type="button"
              onClick={onRetry}
              className="glow-cyan min-h-10 rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-4 text-sm font-semibold text-cyan-50"
            >
              {t("retry")}
            </button>
          ) : null}
          {puzzleState === "success" ? (
            <button
              type="button"
              onClick={onNext}
              className="glow-violet min-h-10 rounded-xl border border-violet-300/30 bg-violet-400/10 px-4 text-sm font-semibold text-violet-50"
            >
              {t("nextPuzzle")}
            </button>
          ) : null}
          {puzzleState === "pathDone" ? (
            <button
              type="button"
              onClick={onPlayComputer}
              className="glow-cyan min-h-10 rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-4 text-sm font-semibold text-cyan-50"
            >
              {t("modeComputer")}
            </button>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
}
