export default function ResignDrawBar({
  t,
  drawOffer,
  onResign,
  onOfferDraw,
  onAcceptDraw,
  onDeclineDraw,
  onDismissDecline,
}) {
  if (drawOffer === "confirm") {
    return (
      <div className="glass-panel flex items-center justify-between gap-2 rounded-2xl px-3 py-2">
        <p className="text-xs text-white/75">{t("drawConfirm")}</p>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={onAcceptDraw}
            className="min-h-9 rounded-xl border border-cyan-300/25 px-3 text-xs font-semibold text-cyan-100"
          >
            {t("accept")}
          </button>
          <button type="button" onClick={onDeclineDraw} className="min-h-9 rounded-xl px-3 text-xs text-white/50">
            {t("decline")}
          </button>
        </div>
      </div>
    );
  }

  if (drawOffer === "declined") {
    return (
      <div className="glass-panel flex items-center justify-between gap-2 rounded-2xl px-3 py-2">
        <p className="text-xs text-amber-100/85">{t("drawDeclined")}</p>
        <button type="button" onClick={onDismissDecline} className="text-xs text-white/45">
          {t("ok")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-1.5">
      <button
        type="button"
        onClick={onOfferDraw}
        className="min-h-9 flex-1 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-white/70"
      >
        {t("offerDraw")}
      </button>
      <button
        type="button"
        onClick={onResign}
        className="min-h-9 flex-1 rounded-xl border border-rose-300/20 bg-rose-400/10 text-xs font-semibold text-rose-100"
      >
        {t("resign")}
      </button>
    </div>
  );
}
