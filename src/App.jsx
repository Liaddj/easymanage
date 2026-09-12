import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import AppShell from "./components/AppShell.jsx";
import CapturedPieces from "./components/CapturedPieces.jsx";
import ChessGameBoard from "./components/ChessGameBoard.jsx";
import CoachPanel from "./components/CoachPanel.jsx";
import EvaluationBar from "./components/EvaluationBar.jsx";
import GameControls from "./components/GameControls.jsx";
import GameOverOverlay from "./components/GameOverOverlay.jsx";
import Header from "./components/Header.jsx";
import MoveList from "./components/MoveList.jsx";
import PromotionDialog from "./components/PromotionDialog.jsx";
import { useChessGame } from "./hooks/useChessGame.js";
import { t as translate } from "./i18n.js";

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem("maestro_lang") || "he");
  const game = useChessGame();
  const t = (key) => translate(lang, key);

  useEffect(() => {
    document.documentElement.lang = lang === "he" ? "he" : "en";
    document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
    document.title = `${translate(lang, "brand")} — ${translate(lang, "tagline")}`;
    localStorage.setItem("maestro_lang", lang);
  }, [lang]);

  const promoColor = game.pendingPromotion
    ? game.game.get(game.pendingPromotion.from)?.color ?? game.game.turn()
    : game.game.turn();

  return (
    <AppShell>
      <Header
        lang={lang}
        t={t}
        statusLabel={t(game.status)}
        coachMode={game.coachMode}
        onToggleLang={() => setLang((prev) => (prev === "he" ? "en" : "he"))}
      />

      <main className="mt-2 flex min-h-0 flex-1 flex-col gap-2 lg:flex-row lg:gap-3">
        <section className="flex min-h-0 flex-[1.15] flex-col gap-1.5">
          <CapturedPieces taken={game.taken} material={game.material} t={t} />
          <div className="relative flex min-h-0 flex-1 items-center justify-center gap-2">
            <EvaluationBar percent={game.evalPercent} score={game.evalScore} t={t} />
            <div className="relative min-h-0">
              <ChessGameBoard gameState={game} />
              <AnimatePresence>
                {game.pendingPromotion ? (
                  <PromotionDialog
                    t={t}
                    color={promoColor}
                    onPick={game.completePromotion}
                    onCancel={game.cancelPromotion}
                  />
                ) : null}
              </AnimatePresence>
              <GameOverOverlay t={t} status={game.status} onReset={game.reset} />
            </div>
          </div>
          <p className="hidden px-1 text-[10px] text-white/30 sm:block">{t("drawHint")}</p>
        </section>

        <aside className="flex min-h-0 shrink-0 flex-col gap-2 lg:w-[22rem] lg:max-w-[38%]">
          <div className="flex min-h-0 flex-[1.1] flex-col gap-2 lg:flex-[1.4]">
            <CoachPanel
              lang={lang}
              t={t}
              analysis={game.analysis}
              evalScore={game.evalScore}
              evalPercent={game.evalPercent}
              coachMode={game.coachMode}
            />
          </div>
          <div className="h-[4.4rem] shrink-0 lg:h-auto lg:min-h-[8rem] lg:flex-1">
            <MoveList pairs={game.movePairs} t={t} />
          </div>
          <GameControls
            t={t}
            canUndo={game.canUndo}
            canRedo={game.canRedo}
            coachMode={game.coachMode}
            arrowMode={game.arrowMode}
            hintMove={game.hintMove}
            onUndo={game.undo}
            onRedo={game.redo}
            onReset={game.reset}
            onFlip={game.flip}
            onToggleCoach={() => game.setCoachMode((v) => !v)}
            onToggleArrows={() => game.setArrowMode((v) => !v)}
            onHint={game.requestHint}
            onPlayHint={game.playHint}
          />
        </aside>
      </main>
    </AppShell>
  );
}
