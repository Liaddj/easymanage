import { AnimatePresence, motion } from "framer-motion";
import { pick } from "../i18n.js";

const TONE = {
  info: "from-cyan-400/15 to-transparent border-cyan-300/25",
  good: "from-emerald-400/15 to-transparent border-emerald-300/25",
  warn: "from-amber-400/15 to-transparent border-amber-300/30",
  danger: "from-rose-400/18 to-transparent border-rose-300/35",
  success: "from-violet-400/18 to-transparent border-violet-300/30",
};

export default function CoachPanel({ lang, t, analysis, evalScore, evalPercent, coachMode, opening, hintMove }) {
  const tone = TONE[analysis.tone] ?? TONE.info;
  const title = pick(lang, analysis.title);
  const body = pick(lang, analysis.body);
  const openingName = pick(lang, opening ?? analysis.opening);
  const pawns = `${evalScore >= 0 ? "+" : ""}${(evalScore / 100).toFixed(1)}`;
  const evalLabel =
    Math.abs(evalScore) < 40 ? t("evalEven") : evalScore > 0 ? t("evalWhite") : t("evalBlack");

  return (
    <section className={`glass-panel relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-gradient-to-br ${tone}`}>
      <div className="flex items-center justify-between gap-2 border-b border-white/5 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
          <h2 className="font-display text-[11px] tracking-[0.2em] text-white/80 uppercase">{t("coach")}</h2>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-white/45">{evalLabel}</span>
          <span className="rounded-md border border-white/10 bg-black/30 px-1.5 py-0.5 font-mono text-cyan-200">
            {pawns}
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden px-3 py-2">
        {coachMode ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${analysis.id}-${title}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="h-full"
            >
              {openingName ? (
                <p className="mb-1 text-[10px] font-semibold tracking-wide text-violet-200/80 uppercase">
                  {openingName}
                </p>
              ) : null}
              <h3 className="text-sm font-semibold text-white sm:text-[15px]">{title}</h3>
              <p className="mt-1 line-clamp-4 text-xs leading-relaxed text-white/70 sm:line-clamp-6 sm:text-[13px]">
                {body}
              </p>
              {hintMove ? (
                <p className="mt-2 rounded-lg border border-lime-300/30 bg-lime-400/10 px-2 py-1 text-[11px] text-lime-100">
                  {t("hintReady")}: <span className="font-mono">{hintMove.san}</span>
                </p>
              ) : null}
            </motion.div>
          </AnimatePresence>
        ) : (
          <p className="text-xs text-white/45">{t("coachOff")}</p>
        )}
      </div>

      <div className="mx-3 mb-2 hidden h-1 overflow-hidden rounded-full bg-black/40 sm:block">
        <motion.div
          className="h-full bg-gradient-to-r from-violet-400 via-white to-cyan-300"
          animate={{ width: `${Math.max(4, Math.min(96, evalPercent))}%` }}
          transition={{ type: "spring", stiffness: 160, damping: 24 }}
        />
      </div>
    </section>
  );
}
