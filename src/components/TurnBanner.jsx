export default function TurnBanner({ t, status, mode, thinking, isPlayerTurn, humanColor }) {
  let label = t(status);
  let tone = "border-white/10 bg-white/5 text-white/80";

  if (thinking) {
    label = t("computerThinking");
    tone = "border-violet-300/40 bg-violet-400/15 text-violet-100 turn-pulse";
  } else if (status === "check") {
    tone = "border-rose-300/50 bg-rose-400/15 text-rose-100";
  } else if (["whiteWins", "blackWins", "stalemate", "draw"].includes(status)) {
    tone = "border-cyan-300/40 bg-cyan-400/10 text-cyan-50";
  } else if (mode !== "free" && isPlayerTurn) {
    label = humanColor === "b" ? t("yourTurnBlack") : t("yourTurnWhite");
    tone = "border-cyan-300/45 bg-cyan-400/15 text-cyan-50 turn-pulse";
  } else if (mode === "computer" && !isPlayerTurn) {
    label = t("waitingComputer");
    tone = "border-violet-300/30 bg-violet-400/10 text-violet-100";
  } else if (status === "whiteToMove") {
    tone = "border-white/20 bg-white/10 text-white";
  } else if (status === "blackToMove") {
    tone = "border-violet-200/20 bg-black/40 text-violet-100";
  }

  return (
    <p
      role="status"
      aria-live="polite"
      className={`max-w-[11rem] truncate rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide sm:max-w-none sm:text-[11px] ${tone}`}
    >
      {label}
    </p>
  );
}
