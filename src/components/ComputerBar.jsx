const LEVELS = [
  { id: "easy", key: "easy" },
  { id: "medium", key: "medium" },
  { id: "hard", key: "hard" },
];

export default function ComputerBar({ t, difficulty, humanColor, onDifficulty, onColor, onNewGame }) {
  return (
    <div className="glass-panel flex shrink-0 flex-wrap items-center justify-between gap-1.5 rounded-2xl px-2 py-1.5">
      <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t("difficulty")}>
        {LEVELS.map((level) => (
          <button
            key={level.id}
            type="button"
            onClick={() => onDifficulty(level.id)}
            aria-pressed={difficulty === level.id}
            className={`min-h-8 rounded-lg px-2 text-[11px] font-semibold ${
              difficulty === level.id
                ? "bg-violet-400/20 text-violet-100"
                : "text-white/50 hover:text-white"
            }`}
          >
            {t(level.key)}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onColor("w")}
          aria-pressed={humanColor === "w"}
          className={`min-h-8 rounded-lg px-2 text-[11px] font-semibold ${
            humanColor === "w" ? "bg-white/15 text-white" : "text-white/45"
          }`}
        >
          {t("playWhite")}
        </button>
        <button
          type="button"
          onClick={() => onColor("b")}
          aria-pressed={humanColor === "b"}
          className={`min-h-8 rounded-lg px-2 text-[11px] font-semibold ${
            humanColor === "b" ? "bg-white/15 text-white" : "text-white/45"
          }`}
        >
          {t("playBlack")}
        </button>
        <button
          type="button"
          onClick={onNewGame}
          className="glow-cyan min-h-8 rounded-lg border border-cyan-300/20 px-2 text-[11px] font-semibold text-cyan-100"
        >
          {t("newGame")}
        </button>
      </div>
    </div>
  );
}
