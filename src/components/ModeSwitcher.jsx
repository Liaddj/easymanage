const MODES = [
  { id: "puzzle", key: "modePuzzle" },
  { id: "computer", key: "modeComputer" },
  { id: "free", key: "modeFree" },
];

export default function ModeSwitcher({ t, mode, onChange }) {
  return (
    <nav className="glass-panel grid shrink-0 grid-cols-3 gap-1 rounded-2xl p-1" aria-label={t("modes")}>
      {MODES.map((item) => {
        const active = mode === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            aria-pressed={active}
            className={`min-h-9 rounded-xl px-2 text-[11px] font-semibold tracking-wide transition sm:text-xs ${
              active
                ? "bg-cyan-400/20 text-cyan-50 shadow-[0_0_14px_rgba(34,211,238,0.22)]"
                : "text-white/60 hover:text-white"
            }`}
          >
            {t(item.key)}
          </button>
        );
      })}
    </nav>
  );
}
