export default function MoveList({ pairs, t }) {
  return (
    <section className="glass-panel flex min-h-0 flex-col overflow-hidden rounded-2xl">
      <h2 className="shrink-0 px-3 pt-2 font-display text-[11px] tracking-[0.2em] text-white/55 uppercase">
        {t("moves")}
      </h2>
      <ol className="slim-scroll flex min-h-0 flex-1 gap-1.5 overflow-x-auto overflow-y-hidden px-3 py-2 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto">
        {pairs.length === 0 ? (
          <li className="text-xs text-white/35">{t("noMoves")}</li>
        ) : (
          pairs.map((pair) => (
            <li
              key={pair.n}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white/[0.03] px-2 py-1 font-mono text-[11px] text-white/80 lg:w-full"
            >
              <span className="w-5 text-cyan-300/70">{pair.n}.</span>
              <span className="min-w-8">{pair.white}</span>
              <span className="min-w-8 text-violet-200/90">{pair.black}</span>
            </li>
          ))
        )}
      </ol>
    </section>
  );
}
