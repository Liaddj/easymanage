import { motion } from "framer-motion";

export default function Header({ t, statusLabel, onToggleLang, coachMode }) {
  return (
    <header className="glass-panel flex shrink-0 items-center justify-between gap-2 rounded-2xl px-3 py-2 sm:px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <motion.div
          className="relative grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/40 bg-void"
          animate={{
            boxShadow: [
              "0 0 12px rgba(34,211,238,0.25)",
              "0 0 26px rgba(192,132,252,0.4)",
              "0 0 12px rgba(34,211,238,0.25)",
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="font-display text-xl text-cyan-300" aria-hidden>
            ♘
          </span>
        </motion.div>
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <h1 className="font-display text-sm font-semibold tracking-[0.22em] text-white sm:text-base">
              {t("brand")}
            </h1>
            <span className="hidden truncate text-[11px] text-cyan-100/50 sm:inline">{t("tagline")}</span>
          </div>
          <p className="truncate text-xs font-medium text-cyan-200">{statusLabel}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`hidden rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase sm:inline ${
            coachMode
              ? "border-violet-300/50 bg-violet-400/15 text-violet-100"
              : "border-white/10 bg-white/5 text-white/45"
          }`}
        >
          {coachMode ? t("coachOn") : t("coachOff")}
        </span>
        <button
          type="button"
          onClick={onToggleLang}
          className="glow-cyan rounded-xl border border-cyan-300/25 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-50"
          aria-label={t("langFull")}
        >
          {t("lang")}
        </button>
      </div>
    </header>
  );
}
