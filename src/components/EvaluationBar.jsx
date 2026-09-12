import { motion } from "framer-motion";

/**
 * Simulated evaluation bar. White advantage grows from the bottom (standard chess UI).
 */
export default function EvaluationBar({ percent, score, t }) {
  const whitePct = Math.max(4, Math.min(96, percent));
  const label =
    Math.abs(score) < 40 ? t("evalEven") : score > 0 ? t("evalWhite") : t("evalBlack");
  const pawns = (score / 100).toFixed(1);

  return (
    <div className="flex h-full w-3.5 shrink-0 flex-col overflow-hidden rounded-full border border-white/10 bg-zinc-950 sm:w-4">
      <div className="relative flex h-full w-full flex-col-reverse">
        <motion.div
          className="w-full bg-gradient-to-t from-zinc-100 to-cyan-100"
          animate={{ height: `${whitePct}%` }}
          transition={{ type: "spring", stiffness: 140, damping: 22 }}
        />
        <div className="absolute inset-x-0 top-1 hidden text-center text-[8px] font-bold text-violet-200/80 sm:block">
          {score < 0 ? pawns : ""}
        </div>
        <div className="absolute inset-x-0 bottom-1 hidden text-center text-[8px] font-bold text-void sm:block">
          {score > 0 ? `+${pawns}` : ""}
        </div>
      </div>
      <span className="sr-only">
        {label} {pawns}
      </span>
    </div>
  );
}
