import { useCallback, useMemo, useState } from "react";
import { Chess } from "chess.js";
import {
  capturedPieces,
  collectThreats,
  materialDiff,
  needsPromotion,
  pairMoves,
  START_FEN,
} from "../lib/board.js";
import { analyzeMove, hintArrows, welcomeAnalysis } from "../lib/coach.js";
import { evaluatePosition, scoreToWhitePercent, suggestMove } from "../lib/evaluate.js";

const START = { fen: START_FEN, move: null, analysis: welcomeAnalysis() };

/**
 * Educational game state: a fen timeline + cursor (undo/redo),
 * plus coach overlays (threats, arrows, hints). No backend.
 */
export function useChessGame() {
  const [nav, setNav] = useState({ timeline: [START], cursor: 0 });
  const [selected, setSelected] = useState(null);
  const [pendingPromotion, setPendingPromotion] = useState(null);
  const [orientation, setOrientation] = useState("white");
  const [coachMode, setCoachMode] = useState(true);
  const [arrowMode, setArrowMode] = useState(false);
  const [userArrows, setUserArrows] = useState([]);
  const [arrowDraft, setArrowDraft] = useState(null);
  const [hintMove, setHintMove] = useState(null);

  const { timeline, cursor } = nav;
  const fen = timeline[cursor].fen;
  const lastMove = timeline[cursor].move;
  const analysis = timeline[cursor].analysis ?? welcomeAnalysis();

  const game = useMemo(() => new Chess(fen), [fen]);

  const legalMoves = useMemo(() => {
    if (!selected) return [];
    return game.moves({ square: selected, verbose: true });
  }, [game, selected]);

  const threats = useMemo(() => (coachMode ? collectThreats(game) : []), [coachMode, game]);
  const evalScore = useMemo(() => evaluatePosition(game), [game]);
  const evalPercent = scoreToWhitePercent(evalScore);
  const taken = useMemo(() => capturedPieces(game), [game]);
  const material = useMemo(() => materialDiff(game), [game]);
  const movePairs = useMemo(() => pairMoves(game.history()), [game]);

  const status = useMemo(() => {
    if (game.isCheckmate()) return game.turn() === "w" ? "blackWins" : "whiteWins";
    if (game.isStalemate()) return "stalemate";
    if (game.isDraw()) return "draw";
    if (game.isCheck()) return "check";
    return game.turn() === "w" ? "whiteToMove" : "blackToMove";
  }, [game]);

  const gameOver = game.isGameOver();

  const clearEphemeral = useCallback(() => {
    setSelected(null);
    setPendingPromotion(null);
    setUserArrows([]);
    setArrowDraft(null);
    setHintMove(null);
  }, []);

  const commitMove = useCallback((from, to, promotion) => {
    let applied = false;
    setNav((s) => {
      const current = s.timeline[s.cursor];
      const probe = new Chess(current.fen);
      const move = probe.move({ from, to, promotion: promotion || undefined });
      if (!move) return s;
      applied = true;
      const next = {
        fen: probe.fen(),
        move,
        analysis: analyzeMove(current.fen, move, probe),
      };
      return {
        timeline: [...s.timeline.slice(0, s.cursor + 1), next],
        cursor: s.cursor + 1,
      };
    });
    clearEphemeral();
    return applied;
  }, [clearEphemeral]);

  const tryMove = useCallback(
    (from, to, promotion) => {
      if (gameOver) return false;
      const probe = new Chess(fen);
      if (needsPromotion(probe, from, to) && !promotion) {
        const legal = probe.moves({ square: from, verbose: true }).some((m) => m.to === to);
        if (!legal) return false;
        setPendingPromotion({ from, to });
        setSelected(null);
        return false;
      }
      return commitMove(from, to, promotion);
    },
    [commitMove, fen, gameOver],
  );

  const handleSquareClick = useCallback(
    (square) => {
      if (pendingPromotion) return;

      if (arrowMode) {
        if (!arrowDraft) {
          setArrowDraft(square);
          return;
        }
        if (arrowDraft !== square) {
          setUserArrows((prev) => [
            ...prev.filter((a) => !(a.startSquare === arrowDraft && a.endSquare === square)),
            { startSquare: arrowDraft, endSquare: square, color: "#c084fc" },
          ]);
        }
        setArrowDraft(null);
        return;
      }

      if (gameOver) return;

      if (selected && legalMoves.some((m) => m.to === square)) {
        tryMove(selected, square);
        return;
      }

      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelected(square);
        return;
      }
      setSelected(null);
    },
    [arrowDraft, arrowMode, game, gameOver, legalMoves, pendingPromotion, selected, tryMove],
  );

  const undo = useCallback(() => {
    setNav((s) => ({ ...s, cursor: Math.max(0, s.cursor - 1) }));
    setSelected(null);
    setPendingPromotion(null);
    setHintMove(null);
    setUserArrows([]);
  }, []);

  const redo = useCallback(() => {
    setNav((s) => ({ ...s, cursor: Math.min(s.timeline.length - 1, s.cursor + 1) }));
    setSelected(null);
    setPendingPromotion(null);
    setHintMove(null);
    setUserArrows([]);
  }, []);

  const reset = useCallback(() => {
    setNav({ timeline: [START], cursor: 0 });
    clearEphemeral();
  }, [clearEphemeral]);

  const requestHint = useCallback(() => {
    const move = suggestMove(game);
    setHintMove(move);
    return move;
  }, [game]);

  const playHint = useCallback(() => {
    const move = hintMove ?? suggestMove(game);
    if (!move) return false;
    return tryMove(move.from, move.to, move.promotion);
  }, [game, hintMove, tryMove]);

  const coachArrows = coachMode ? (analysis.arrows ?? []) : [];
  const hintArrowList = hintMove ? hintArrows(hintMove) : [];
  const arrows = [...coachArrows, ...hintArrowList, ...userArrows];

  return {
    fen,
    game,
    lastMove,
    analysis,
    selected,
    legalMoves,
    threats,
    evalScore,
    evalPercent,
    taken,
    material,
    movePairs,
    status,
    gameOver,
    pendingPromotion,
    orientation,
    coachMode,
    arrowMode,
    arrows,
    arrowDraft,
    hintMove,
    canUndo: cursor > 0,
    canRedo: cursor < timeline.length - 1,
    ply: cursor,
    tryMove,
    handleSquareClick,
    completePromotion: (piece) => {
      if (!pendingPromotion) return;
      tryMove(pendingPromotion.from, pendingPromotion.to, piece);
    },
    cancelPromotion: () => setPendingPromotion(null),
    undo,
    redo,
    reset,
    flip: () => setOrientation((o) => (o === "white" ? "black" : "white")),
    setCoachMode,
    setArrowMode,
    setUserArrows,
    requestHint,
    playHint,
    clearArrows: () => {
      setUserArrows([]);
      setArrowDraft(null);
      setHintMove(null);
    },
  };
}
