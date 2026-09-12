function Btn({ onClick, disabled, active, glow = "glow-cyan", children, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`${glow} flex min-h-10 min-w-0 flex-1 flex-col items-center justify-center rounded-xl border px-1 py-1 text-[10px] font-semibold leading-tight transition disabled:cursor-not-allowed disabled:opacity-35 sm:text-[11px] ${
        active
          ? "border-cyan-300/50 bg-cyan-400/15 text-cyan-100"
          : "border-white/10 bg-white/5 text-white/80"
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
    <div className="glass-panel grid shrink-0 grid-cols-4 gap-1.5 rounded-2xl p-1.5 sm:grid-cols-8">
      <Btn onClick={onUndo} disabled={!canUndo} label={t("undo")}>
        ↩ {t("undo")}
      </Btn>
      <Btn onClick={onRedo} disabled={!canRedo} label={t("redo")}>
        ↪ {t("redo")}
      </Btn>
      <Btn onClick={onReset} glow="glow-violet" label={t("reset")}>
        ✶ {t("reset")}
      </Btn>
      <Btn onClick={onFlip} label={t("flip")}>
        ⇄ {t("flip")}
      </Btn>
      <Btn onClick={onToggleCoach} active={coachMode} glow="glow-violet" label={t("coach")}>
        ✦ {t("coach")}
      </Btn>
      <Btn onClick={onToggleArrows} active={arrowMode} label={t("arrows")}>
        ↗ {t("arrows")}
      </Btn>
      <Btn onClick={onHint} active={Boolean(hintMove)} label={t("hint")}>
        ? {t("hint")}
      </Btn>
      <Btn onClick={onPlayHint} disabled={!hintMove} label={t("playHint")}>
        ▶ {t("playHint")}
      </Btn>
    </div>
  );
}
