function Btn({ onClick, disabled, active, glow = "glow-cyan", children, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active || undefined}
      className={`${glow} flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-35 ${
        active
          ? "border-cyan-300/60 bg-cyan-400/20 text-cyan-50 shadow-[0_0_16px_rgba(34,211,238,0.25)]"
          : "border-cyan-300/15 bg-black/25 text-white/90"
      }`}
    >
      {children}
    </button>
  );
}

export default function GameControls({
  t,
  canUndo,
  canRedo,
  coachMode,
  arrowMode,
  hintMove,
  onUndo,
  onRedo,
  onReset,
  onFlip,
  onToggleCoach,
  onToggleArrows,
  onHint,
  onPlayHint,
}) {
  return (
    <div className="glass-panel grid shrink-0 grid-cols-4 gap-1.5 rounded-2xl p-2">
      <Btn onClick={onUndo} disabled={!canUndo} label={t("undo")}>
        <span aria-hidden>↩</span>
        <span>{t("undo")}</span>
      </Btn>
      <Btn onClick={onRedo} disabled={!canRedo} label={t("redo")}>
        <span aria-hidden>↪</span>
        <span>{t("redo")}</span>
      </Btn>
      <Btn onClick={onReset} glow="glow-violet" label={t("reset")}>
        <span aria-hidden>✶</span>
        <span>{t("reset")}</span>
      </Btn>
      <Btn onClick={onFlip} label={t("flip")}>
        <span aria-hidden>⇄</span>
        <span>{t("flip")}</span>
      </Btn>
      <Btn onClick={onToggleCoach} active={coachMode} glow="glow-violet" label={t("coach")}>
        <span aria-hidden>✦</span>
        <span>{t("coach")}</span>
      </Btn>
      <Btn onClick={onToggleArrows} active={arrowMode} label={t("arrows")}>
        <span aria-hidden>↗</span>
        <span>{t("arrows")}</span>
      </Btn>
      <Btn onClick={onHint} active={Boolean(hintMove)} label={t("hint")}>
        <span aria-hidden>?</span>
        <span>{t("hint")}</span>
      </Btn>
      <Btn onClick={onPlayHint} disabled={!hintMove} label={t("playHint")}>
        <span aria-hidden>▶</span>
        <span>{t("playHint")}</span>
      </Btn>
    </div>
  );
}
