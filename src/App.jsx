import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import AppShell from "./components/AppShell.jsx";
import CapturedPieces from "./components/CapturedPieces.jsx";
import ChessGameBoard from "./components/ChessGameBoard.jsx";
import CoachPanel from "./components/CoachPanel.jsx";
import ComputerBar from "./components/ComputerBar.jsx";
import CurriculumBar from "./components/CurriculumBar.jsx";
import EvaluationBar from "./components/EvaluationBar.jsx";
import GameControls from "./components/GameControls.jsx";
import GameOverOverlay from "./components/GameOverOverlay.jsx";
import Header from "./components/Header.jsx";
import ModeSwitcher from "./components/ModeSwitcher.jsx";
import MoveList from "./components/MoveList.jsx";
import PromotionDialog from "./components/PromotionDialog.jsx";
import PuzzleGoal from "./components/PuzzleGoal.jsx";
import ResignDrawBar from "./components/ResignDrawBar.jsx";
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

  useEffect(() => {
    function onKey(event) {
      const key = event.key.toLowerCase();
      if (event.key === "Escape") {
        game.deselect();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && key === "z") {
        event.preventDefault();
        if (event.shiftKey) game.redo();
        else game.undo();
      }
      if ((event.metaKey || event.ctrlKey) && key === "y") {
        event.preventDefault();
        game.redo();
      }
      if (key === "h" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const tag = event.target?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        game.requestHint();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game.deselect, game.redo, game.requestHint, game.undo]);

  const promoColor = game.pendingPromotion
    ? game.game.get(game.pendingPromotion.from)?.color ?? game.game.turn()
    : game.game.turn();

  return (
    <AppShell>
      <Header
        t={t}
        status={game.status}
        mode={game.mode}
        thinking={game.thinking}
        isPlayerTurn={game.isPlayerTurn}
        humanColor={game.humanColor}
        coachMode={game.coachMode}
        soundOn={game.soundOn}
        onToggleLang={() => setLang((prev) => (prev === "he" ? "en" : "he"))}
        onToggleSound={() => {
          game.unlockSounds();
          game.setSoundOn((v) => !v);
        }}
      />

      <ModeSwitcher t={t} mode={game.mode} onChange={game.setMode} />

      {game.mode === "puzzle" ? (
        <CurriculumBar
          lang={lang}
          t={t}
          stages={game.stages}
          stage={game.stage}
          puzzle={game.puzzle}
          progress={game.progress}
          stageProgress={game.stageProgress}
          overallProgress={game.overallProgress}
          onOpen={game.openStage}
        />
      ) : null}

      {game.mode === "computer" ? (
        <ComputerBar
          t={t}
          difficulty={game.difficulty}
          humanColor={game.humanColor}
          onDifficulty={game.setDifficulty}
          onColor={game.setHumanColor}
          onNewGame={game.reset}
        />
      ) : null}

      <main className="mt-1.5 flex min-h-0 flex-1 flex-col gap-2 lg:flex-row lg:gap-3">
        <section className="flex min-h-0 flex-[1.15] flex-col gap-1.5">
          <CapturedPieces taken={game.taken} material={game.material} t={t} />
          <div className="relative flex min-h-0 flex-1 items-center justify-center gap-2">
            <div className="board-ltr relative flex min-h-0 items-center gap-2">
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
                {game.mode !== "puzzle" ? (
                  <GameOverOverlay t={t} status={game.status} onReset={game.reset} />
                ) : null}
                {game.thinking ? (
                  <p className="pointer-events-none absolute inset-x-3 bottom-3 z-10 rounded-lg bg-black/55 px-2 py-1 text-center text-[11px] text-violet-100">
                    {t("computerThinking")}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
          {game.arrowMode ? (
            <p className="rounded-lg border border-violet-300/30 bg-violet-400/10 px-2 py-1 text-center text-[11px] text-violet-100">
              {t("arrowModeOn")}
            </p>
          ) : (
            <p className="hidden px-1 text-[10px] text-cyan-100/35 sm:block">{t("drawHint")}</p>
          )}
        </section>

        <aside className="flex min-h-0 shrink-0 flex-col gap-2 lg:w-[22rem] lg:max-w-[38%]">
          <div className="flex min-h-0 flex-[1.1] flex-col gap-2 lg:flex-[1.4]">
            {game.mode === "puzzle" ? (
              <PuzzleGoal
                lang={lang}
                t={t}
                stage={game.stage}
                puzzle={game.puzzle}
                puzzleState={game.puzzleState}
                onRetry={game.retryPuzzle}
                onNext={game.goNextPuzzle}
                onPlayComputer={() => game.setMode("computer")}
              />
            ) : (
              <CoachPanel
                lang={lang}
                t={t}
                analysis={game.thinking ? { ...game.analysis, body: { en: t("thinkingHint"), he: t("thinkingHint") } } : game.analysis}
                evalScore={game.evalScore}
                evalPercent={game.evalPercent}
                coachMode={game.coachMode}
                hintMove={game.hintMove}
              />
            )}
          </div>
          <div className="h-[4.4rem] shrink-0 lg:h-auto lg:min-h-[8rem] lg:flex-1">
            <MoveList pairs={game.movePairs} t={t} />
          </div>
          {game.mode !== "puzzle" ? (
            <ResignDrawBar
              t={t}
              drawOffer={game.drawOffer}
              onResign={game.resign}
              onOfferDraw={game.offerDraw}
              onAcceptDraw={game.acceptDraw}
              onDeclineDraw={game.dismissDrawOffer}
              onDismissDecline={game.dismissDrawOffer}
            />
          ) : null}
          <GameControls
            t={t}
            canUndo={game.canUndo}
            canRedo={game.canRedo}
            hideUndo={game.mode === "puzzle"}
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
