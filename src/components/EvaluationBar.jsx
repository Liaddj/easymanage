import { motion } from "framer-motion";

/** White advantage grows from the bottom (standard chess UI). Always LTR. */
export default function EvaluationBar({ percent, score, t }) {
  const whitePct = Math.max(6, Math.min(94, percent));
  const label =
    Math.abs(score) < 40 ? t("evalEven") : score > 0 ? t("evalWhite") : t("evalBlack");
  const pawns = `${score >= 0 ? "+" : ""}${(score / 100).toFixed(1)}`;

  return (
    <div className="board-ltr flex h-full shrink-0 flex-col items-center gap-1" title={`${label} ${pawns}`}>
      <span className="text-[10px] font-bold text-violet-200/90">B</span>
      <div className="relative flex h-full w-4 flex-col-reverse overflow-hidden rounded-full border border-cyan-300/25 bg-zinc-950 sm:w-5">
        <motion.div
          className="w-full bg-gradient-to-t from-zinc-100 via-cyan-100 to-white"
          animate={{ height: `${whitePct}%` }}
          transition={{ type: "spring", stiffness: 140, damping: 22 }}
        />
      </div>
      <span className="text-[10px] font-bold text-cyan-100">W</span>
      <span className="sr-only">
        {label} {pawns}
      </span>
    </div>
  );
}
