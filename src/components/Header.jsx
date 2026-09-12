import { motion } from "framer-motion";

export default function Header({ lang, t, statusLabel, onToggleLang, coachMode }) {
  return (
    <header className="glass-panel flex shrink-0 items-center justify-between gap-2 rounded-2xl px-3 py-2 sm:px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <motion.div
          className="relative grid h-9 w-9 place-items-center rounded-xl border border-cyan-400/30 bg-void"
          animate={{ boxShadow: ["0 0 10px rgba(34,211,238,0.15)", "0 0 22px rgba(192,132,252,0.28)", "0 0 10px rgba(34,211,238,0.15)"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="font-display text-lg text-cyan-300" aria-hidden>
            ♘
          </span>
        </motion.div>
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <h1 className="font-display text-[0.95rem] font-semibold tracking-[0.18em] text-white sm:text-base">
              {t("brand")}
            </h1>
            <span className="hidden truncate text-[11px] text-white/45 sm:inline">{t("tagline")}</span>
          </div>
          <p className="truncate text-[11px] text-cyan-200/80 sm:text-xs">{statusLabel}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`hidden rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase sm:inline ${
            coachMode
              ? "border-violet-400/40 bg-violet-400/10 text-violet-200"
              : "border-white/10 bg-white/5 text-white/45"
          }`}
        >
          {coachMode ? t("coachOn") : t("coachOff")}
        </span>
        <button
          type="button"
          onClick={onToggleLang}
          className="glow-cyan rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-white/80"
          aria-label={t("langFull")}
        >
          {t("lang")}
        </button>
      </div>
    </header>
  );
}
