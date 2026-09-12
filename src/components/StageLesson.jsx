import { pick } from "../i18n.js";

export default function StageLesson({ lang, t, stage }) {
  return (
    <section className="glass-panel shrink-0 rounded-2xl px-3 py-2" aria-label={t("lesson")}>
      <p className="text-[10px] font-semibold tracking-[0.16em] text-white/40 uppercase">{t("lesson")}</p>
      <h3 className="mt-0.5 text-sm font-semibold text-white">{pick(lang, stage.title)}</h3>
      <dl className="mt-1.5 space-y-1.5 text-xs leading-relaxed text-white/70">
        <div>
          <dt className="font-semibold text-cyan-200/90">{t("learnWhat")}</dt>
          <dd>{pick(lang, stage.learn)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-violet-200/90">{t("learnWhy")}</dt>
          <dd>{pick(lang, stage.why)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-emerald-200/90">{t("learnHow")}</dt>
          <dd>{pick(lang, stage.how)}</dd>
        </div>
      </dl>
    </section>
  );
}
