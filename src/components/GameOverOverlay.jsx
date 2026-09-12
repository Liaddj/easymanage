import { motion } from "framer-motion";

export default function GameOverOverlay({ t, status, onReset }) {
  if (!["whiteWins", "blackWins", "stalemate", "draw"].includes(status)) return null;

  const title =
    status === "whiteWins"
      ? t("whiteWins")
      : status === "blackWins"
        ? t("blackWins")
        : status === "stalemate"
          ? t("stalemate")
          : t("draw");

  const detail =
    status === "stalemate"
      ? t("stalemateDetail")
      : status === "draw"
        ? t("drawDetail")
        : t("checkmateDetail");

  return (
    <motion.div
      className="absolute inset-0 z-10 grid place-items-center bg-black/45 backdrop-blur-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-panel mx-4 rounded-2xl border-cyan-300/20 px-6 py-5 text-center shadow-[0_0_40px_rgba(34,211,238,0.15)]"
        role="alertdialog"
        aria-labelledby="game-over-title"
      >
        <p id="game-over-title" className="font-display text-lg tracking-wide text-white">
          {title}
        </p>
        <p className="mt-1 text-xs text-white/55">{detail}</p>
        <button
          type="button"
          onClick={onReset}
          className="glow-cyan mt-3 rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100"
        >
          {t("newGame")}
        </button>
      </motion.div>
    </motion.div>
  );
}
