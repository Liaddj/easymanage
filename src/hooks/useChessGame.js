import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import {
  capturedPieces,
  collectThreats,
  materialDiff,
  needsPromotion,
  pairMoves,
  START_FEN,
  statusFromGame,
} from "../lib/board.js";
import { analyzeMove, hintArrows, puzzleAnalysis, puzzleResultAnalysis, welcomeAnalysis } from "../lib/coach.js";
import { getPuzzle, nextPuzzle, puzzleHumanColor, STAGES } from "../lib/curriculum.js";
import { computerAcceptsDraw, pickComputerMove, thinkDelayMs } from "../lib/engine.js";
import { evaluatePosition, scoreToWhitePercent, suggestMove } from "../lib/evaluate.js";
import { loadProgress, markPuzzleResult, pathStats, rememberLocation, stageStats } from "../lib/progress.js";
import { gradePuzzleMove, nextAutoReply } from "../lib/puzzle.js";
import { playSound, soundForMove, unlockSounds } from "../lib/sounds.js";
import { assertLegalTurn, canDragPiece, canSelectSquare, redoSteps, undoSteps } from "../lib/turns.js";

const PREFS_KEY = "maestro_prefs_v1";

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function savePrefs(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

function initialNav(fen, analysis) {
  return { timeline: [{ fen, move: null, analysis }], cursor: 0 };
}

function legalBySanSafe(fen, san) {
  if (!san) return null;
  try {
    const chess = new Chess(fen);
    return (
      chess.moves({ verbose: true }).find((m) => m.san === san || m.san.replace(/[+#]/g, "") === san.replace(/[+#]/g, "")) ??
      null
    );
  } catch {
    return null;
  }
}

function humanMoveCount(solution) {
  return solution.filter((_, i) => i % 2 === 0).length;
}

/**
 * Product game state: chess.js rules, vs-computer, staged puzzles, local prefs.
 */
export function useChessGame() {
  const prefs = useMemo(() => loadPrefs(), []);
  const storedProgress = useMemo(() => loadProgress(), []);

  const [mode, setModeState] = useState(prefs.mode ?? "puzzle");
  const [humanColor, setHumanColorState] = useState(prefs.humanColor ?? "w");
  const [difficulty, setDifficultyState] = useState(prefs.difficulty ?? "medium");
  const [soundOn, setSoundOnState] = useState(prefs.soundOn ?? true);
  const [orientation, setOrientation] = useState(() => {
    if (prefs.orientation) return prefs.orientation;
    if ((prefs.mode ?? "puzzle") === "puzzle") {
      const loc = getPuzzle(storedProgress.lastStageId, storedProgress.lastPuzzleId);
      return puzzleHumanColor(loc.puzzle.fen) === "b" ? "black" : "white";
    }
    return prefs.humanColor === "b" ? "black" : "white";
  });

  const [progress, setProgress] = useState(storedProgress);
  const [stageId, setStageId] = useState(storedProgress.lastStageId);
  const [puzzleId, setPuzzleId] = useState(storedProgress.lastPuzzleId);
  const [puzzleStep, setPuzzleStep] = useState(0);
  const [puzzleState, setPuzzleState] = useState("play");
  const [hintUsed, setHintUsed] = useState(false);

  const { stage, puzzle } = useMemo(() => getPuzzle(stageId, puzzleId), [puzzleId, stageId]);
  const puzzleColor = puzzleHumanColor(puzzle.fen);

  const startFen = mode === "puzzle" ? puzzle.fen : START_FEN;
  const effectiveHuman = mode === "puzzle" ? puzzleColor : mode === "free" ? null : humanColor;

  const [nav, setNav] = useState(() =>
    initialNav(
      prefs.mode === "puzzle" || !prefs.mode ? getPuzzle(storedProgress.lastStageId, storedProgress.lastPuzzleId).puzzle.fen : START_FEN,
      prefs.mode === "puzzle" || !prefs.mode
        ? puzzleAnalysis(getPuzzle(storedProgress.lastStageId, storedProgress.lastPuzzleId).puzzle)
        : welcomeAnalysis(),
    ),
  );
  const [selected, setSelected] = useState(null);
  const [pendingPromotion, setPendingPromotion] = useState(null);
  const [coachMode, setCoachMode] = useState(true);
  const [arrowMode, setArrowMode] = useState(false);
  const [userArrows, setUserArrows] = useState([]);
  const [arrowDraft, setArrowDraft] = useState(null);
  const [hintMove, setHintMove] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [localResult, setLocalResult] = useState(null);
  const [drawOffer, setDrawOffer] = useState(null);
  const thinkToken = useRef(0);

  const { timeline, cursor } = nav;
  const fen = timeline[cursor].fen;
  const lastMove = timeline[cursor].move;
  const analysis = timeline[cursor].analysis ?? welcomeAnalysis();

  const game = useMemo(() => new Chess(fen), [fen]);
  const startTurn = startFen.split(" ")[1] === "b" ? "b" : "w";

  const persistPrefs = useCallback((patch) => {
    savePrefs({
      mode,
      humanColor,
      difficulty,
      soundOn,
      orientation,
      ...patch,
    });
  }, [difficulty, humanColor, mode, orientation, soundOn]);

  const gateMode = mode === "free" ? "free" : mode;
  const gateColor = effectiveHuman ?? game.turn();

  const legalMoves = useMemo(() => {
    if (!selected || thinking || localResult) return [];
    if (mode !== "free" && game.turn() !== gateColor) return [];
    return game.moves({ square: selected, verbose: true });
  }, [game, gateColor, localResult, mode, selected, thinking]);

  const threats = useMemo(() => (coachMode ? collectThreats(game) : []), [coachMode, game]);
  const evalScore = useMemo(() => evaluatePosition(game), [game]);
  const evalPercent = scoreToWhitePercent(evalScore);
  const taken = useMemo(() => capturedPieces(game, startFen), [game, startFen]);
  const material = useMemo(() => materialDiff(game), [game]);
  const historySan = useMemo(
    () => timeline.slice(1, cursor + 1).map((entry) => entry.move?.san).filter(Boolean),
    [cursor, timeline],
  );
  const movePairs = useMemo(() => pairMoves(historySan, startTurn), [historySan, startTurn]);
  const rulesStatus = useMemo(() => statusFromGame(game, localResult), [game, localResult]);
  const gameOver = Boolean(localResult) || game.isGameOver();

  const isPlayerTurn = useMemo(() => {
    if (gameOver || thinking || pendingPromotion) return false;
    if (mode === "free") return true;
    return game.turn() === gateColor;
  }, [game, gameOver, gateColor, mode, pendingPromotion, thinking]);

  const clearEphemeral = useCallback(() => {
    setSelected(null);
    setPendingPromotion(null);
    setUserArrows([]);
    setArrowDraft(null);
    setHintMove(null);
  }, []);

  const cue = useCallback((kind) => playSound(kind, soundOn), [soundOn]);

  const applyCommit = useCallback(
    (move, nextFen) => {
      setNav((s) => {
        const current = s.timeline[s.cursor];
        const probe = new Chess(nextFen);
        const history = [
          ...s.timeline.slice(1, s.cursor + 1).map((entry) => entry.move?.san).filter(Boolean),
          move.san,
        ];
        const next = {
          fen: nextFen,
          move,
          analysis: mode === "puzzle" ? current.analysis : analyzeMove(current.fen, move, probe, history),
        };
        return {
          timeline: [...s.timeline.slice(0, s.cursor + 1), next],
          cursor: s.cursor + 1,
        };
      });
      clearEphemeral();
      cue(soundForMove(move, nextFen, { Chess }));
      return true;
    },
    [clearEphemeral, cue, mode],
  );

  const applyPuzzleAnalysis = useCallback((kind) => {
    setNav((s) => {
      const last = s.timeline[s.cursor];
      if (!last) return s;
      const copy = [...s.timeline];
      copy[s.cursor] = { ...last, analysis: puzzleResultAnalysis(puzzle, kind) };
      return { ...s, timeline: copy };
    });
  }, [puzzle]);

  const tryMove = useCallback(
    (from, to, promotion, actor = "human") => {
      if (gameOver) return false;
      if (puzzleState === "fail" || puzzleState === "success" || puzzleState === "pathDone") return false;
      if (actor === "human" && thinking) return false;

      if (mode === "puzzle" && actor === "human") {
        const probe = new Chess(fen);
        if (needsPromotion(probe, from, to) && !promotion) {
          const legal = probe.moves({ square: from, verbose: true }).some((m) => m.to === to);
          if (!legal) return false;
          setPendingPromotion({ from, to });
          setSelected(null);
          return false;
        }
        const graded = gradePuzzleMove({ ...puzzle, step: puzzleStep }, fen, from, to, promotion);
        if (!graded.ok) return false;
        applyCommit(graded.move, graded.fen);
        if (!graded.correct) {
          setPuzzleState("fail");
          setProgress((prev) => markPuzzleResult(prev, puzzle.id, false));
          cue("fail");
          window.setTimeout(() => applyPuzzleAnalysis("fail"), 0);
          return true;
        }
        const reply = nextAutoReply(puzzle, graded.fen, puzzleStep);
        const nextHumanIndex = puzzleStep + 1;
        if (reply) {
          window.setTimeout(() => {
            const after = new Chess(graded.fen);
            const played = after.move({ from: reply.from, to: reply.to, promotion: reply.promotion });
            if (played) applyCommit(played, after.fen());
          }, 320);
          setPuzzleStep(nextHumanIndex + 1);
        } else {
          setPuzzleStep(nextHumanIndex);
        }
        const completed = reply
          ? puzzleStep + 2 >= puzzle.solution.length
          : nextHumanIndex >= humanMoveCount(puzzle.solution);
        if (completed) {
          setPuzzleState("success");
          setProgress((prev) => markPuzzleResult(prev, puzzle.id, true));
          cue("success");
          window.setTimeout(() => applyPuzzleAnalysis("success"), reply ? 360 : 0);
        }
        return true;
      }

      const probe = new Chess(fen);
      if (actor === "human" && needsPromotion(probe, from, to) && !promotion) {
        const legal = probe.moves({ square: from, verbose: true }).some((m) => m.to === to);
        if (!legal) return false;
        const preview = assertLegalTurn({
          fen,
          from,
          to,
          promotion: "q",
          mode: gateMode,
          humanColor: gateColor,
          actor: mode === "computer" ? "human" : "human",
        });
        if (!preview.ok) return false;
        setPendingPromotion({ from, to });
        setSelected(null);
        return false;
      }

      const gate = assertLegalTurn({
        fen,
        from,
        to,
        promotion,
        mode: gateMode,
        humanColor: gateColor,
        thinking: actor === "human" && thinking,
        actor: mode === "computer" ? actor : "human",
      });
      if (!gate.ok) return false;
      return applyCommit(gate.move, gate.fen);
    },
    [
      applyCommit,
      applyPuzzleAnalysis,
      cue,
      fen,
      gameOver,
      gateColor,
      gateMode,
      mode,
      puzzle,
      puzzleState,
      puzzleStep,
      thinking,
    ],
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
      if (gameOver || thinking) return;
      if (puzzleState !== "play") return;

      if (selected && legalMoves.some((m) => m.to === square)) {
        tryMove(selected, square, undefined, "human");
        return;
      }

      if (canSelectSquare({ chess: game, square, mode: gateMode, humanColor: gateColor, thinking, gameOver })) {
        setSelected(square);
        return;
      }
      setSelected(null);
    },
    [arrowDraft, arrowMode, game, gameOver, gateColor, gateMode, legalMoves, pendingPromotion, puzzleState, selected, thinking, tryMove],
  );

  const loadPosition = useCallback(
    (fenToLoad, analysisCard) => {
      thinkToken.current += 1;
      setThinking(false);
      setLocalResult(null);
      setDrawOffer(null);
      setPuzzleStep(0);
      setHintUsed(false);
      setNav(initialNav(fenToLoad, analysisCard));
      clearEphemeral();
    },
    [clearEphemeral],
  );

  const reset = useCallback(() => {
    if (mode === "puzzle") {
      setPuzzleState("play");
      loadPosition(puzzle.fen, puzzleAnalysis(puzzle));
      return;
    }
    loadPosition(START_FEN, welcomeAnalysis());
  }, [loadPosition, mode, puzzle]);

  const setMode = useCallback(
    (next) => {
      setModeState(next);
      persistPrefs({ mode: next });
      setPuzzleState("play");
      if (next === "puzzle") {
        const loc = getPuzzle(stageId, puzzleId);
        loadPosition(loc.puzzle.fen, puzzleAnalysis(loc.puzzle));
        setOrientation(puzzleHumanColor(loc.puzzle.fen) === "b" ? "black" : "white");
      } else if (next === "computer") {
        loadPosition(START_FEN, welcomeAnalysis());
        setOrientation(humanColor === "b" ? "black" : "white");
      } else {
        loadPosition(START_FEN, welcomeAnalysis());
      }
    },
    [humanColor, loadPosition, persistPrefs, puzzleId, stageId],
  );

  const setHumanColor = useCallback(
    (color) => {
      setHumanColorState(color);
      setOrientation(color === "b" ? "black" : "white");
      persistPrefs({ humanColor: color, orientation: color === "b" ? "black" : "white" });
      if (mode === "computer") loadPosition(START_FEN, welcomeAnalysis());
    },
    [loadPosition, mode, persistPrefs],
  );

  const setDifficulty = useCallback(
    (level) => {
      setDifficultyState(level);
      persistPrefs({ difficulty: level });
    },
    [persistPrefs],
  );

  const setSoundOn = useCallback(
    (value) => {
      const next = typeof value === "function" ? value(soundOn) : value;
      setSoundOnState(next);
      persistPrefs({ soundOn: next });
      if (next) unlockSounds();
    },
    [persistPrefs, soundOn],
  );

  const openStage = useCallback(
    (nextStageId, nextPuzzleId) => {
      const loc = getPuzzle(nextStageId, nextPuzzleId);
      setStageId(loc.stage.id);
      setPuzzleId(loc.puzzle.id);
      setPuzzleState("play");
      setProgress((prev) => rememberLocation(prev, loc.stage.id, loc.puzzle.id));
      setOrientation(puzzleHumanColor(loc.puzzle.fen) === "b" ? "black" : "white");
      loadPosition(loc.puzzle.fen, puzzleAnalysis(loc.puzzle));
      if (mode !== "puzzle") {
        setModeState("puzzle");
        persistPrefs({ mode: "puzzle" });
      }
    },
    [loadPosition, mode, persistPrefs],
  );

  const retryPuzzle = useCallback(() => {
    setPuzzleState("play");
    loadPosition(puzzle.fen, puzzleAnalysis(puzzle));
  }, [loadPosition, puzzle]);

  const goNextPuzzle = useCallback(() => {
    const nxt = nextPuzzle(stageId, puzzleId);
    if (nxt.donePath) {
      setPuzzleState("pathDone");
      return;
    }
    openStage(nxt.stageId, nxt.puzzleId);
  }, [openStage, puzzleId, stageId]);

  const undo = useCallback(() => {
    if (mode === "puzzle") return;
    const steps = undoSteps({
      mode,
      cursor,
      turn: game.turn(),
      humanColor: effectiveHuman ?? "w",
      thinking,
    });
    if (steps <= 0) return;
    thinkToken.current += 1;
    setThinking(false);
    setLocalResult(null);
    setDrawOffer(null);
    setNav((s) => ({ ...s, cursor: Math.max(0, s.cursor - steps) }));
    clearEphemeral();
  }, [clearEphemeral, cursor, effectiveHuman, game, mode, thinking]);

  const redo = useCallback(() => {
    if (mode === "puzzle") return;
    const remaining = timeline.length - 1 - cursor;
    const steps = redoSteps({ mode, remaining });
    if (steps <= 0) return;
    setLocalResult(null);
    setNav((s) => ({ ...s, cursor: Math.min(s.timeline.length - 1, s.cursor + steps) }));
    clearEphemeral();
  }, [clearEphemeral, cursor, mode, timeline.length]);

  const requestHint = useCallback(() => {
    if (mode === "puzzle") {
      const expected = legalBySanSafe(fen, puzzle.solution[puzzleStep] ?? puzzle.solution[0]);
      setHintMove(expected);
      setHintUsed(true);
      setArrowMode(false);
      return expected;
    }
    const move = suggestMove(game);
    setHintMove(move);
    setArrowMode(false);
    return move;
  }, [fen, game, mode, puzzle, puzzleStep]);

  const playHint = useCallback(() => {
    const move =
      hintMove ??
      (mode === "puzzle" ? legalBySanSafe(fen, puzzle.solution[puzzleStep] ?? puzzle.solution[0]) : suggestMove(game));
    if (!move) return false;
    return tryMove(move.from, move.to, move.promotion, "human");
  }, [fen, game, hintMove, mode, puzzle, puzzleStep, tryMove]);

  const resign = useCallback(() => {
    if (mode === "puzzle" || gameOver) return;
    const loser = mode === "free" ? game.turn() : effectiveHuman ?? humanColor;
    setLocalResult(loser === "w" ? "blackWins" : "whiteWins");
    setDrawOffer(null);
    cue("gameover");
  }, [cue, effectiveHuman, game, gameOver, humanColor, mode]);

  const offerDraw = useCallback(() => {
    if (mode === "puzzle" || gameOver) return;
    if (mode === "free") {
      setDrawOffer("confirm");
      return;
    }
    if (computerAcceptsDraw(fen, difficulty)) {
      setLocalResult("draw");
      setDrawOffer(null);
      cue("gameover");
    } else {
      setDrawOffer("declined");
    }
  }, [cue, difficulty, fen, gameOver, mode]);

  const acceptDraw = useCallback(() => {
    setLocalResult("draw");
    setDrawOffer(null);
    cue("gameover");
  }, [cue]);

  useEffect(() => {
    if (mode !== "computer") return;
    if (gameOver || pendingPromotion || localResult) return;
    if (game.turn() === humanColor) return;

    const token = thinkToken.current + 1;
    thinkToken.current = token;
    setThinking(true);
    const delay = thinkDelayMs(difficulty);
    const timer = window.setTimeout(() => {
      if (thinkToken.current !== token) return;
      const move = pickComputerMove(fen, difficulty);
      if (thinkToken.current !== token) return;
      if (move) tryMove(move.from, move.to, move.promotion || undefined, "computer");
      setThinking(false);
    }, delay);

    return () => {
      window.clearTimeout(timer);
      if (thinkToken.current === token) setThinking(false);
    };
  }, [difficulty, fen, game, gameOver, humanColor, localResult, mode, pendingPromotion, tryMove]);

  const coachArrows = coachMode ? (analysis.arrows ?? []) : [];
  const hintArrowList = hintMove ? hintArrows(hintMove) : [];
  const arrows = [...coachArrows, ...hintArrowList, ...userArrows];

  const stageProgress = useMemo(() => stageStats(stage, progress), [progress, stage]);
  const overallProgress = useMemo(() => pathStats(STAGES, progress), [progress]);

  const dragGuard = useCallback(
    ({ piece }) =>
      canDragPiece({
        pieceType: piece?.pieceType,
        turn: game.turn(),
        mode: gateMode,
        humanColor: gateColor,
        thinking,
        gameOver,
        arrowMode,
        pendingPromotion,
      }),
    [arrowMode, game, gameOver, gateColor, gateMode, pendingPromotion, thinking],
  );

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
    status: rulesStatus,
    gameOver,
    pendingPromotion,
    orientation,
    coachMode,
    arrowMode,
    arrows,
    arrowDraft,
    hintMove,
    canUndo: mode !== "puzzle" && cursor > 0,
    canRedo: mode !== "puzzle" && cursor < timeline.length - 1,
    ply: cursor,
    tryMove: (from, to, promotion) => tryMove(from, to, promotion, "human"),
    handleSquareClick,
    completePromotion: (piece) => {
      if (!pendingPromotion) return;
      tryMove(pendingPromotion.from, pendingPromotion.to, piece, "human");
    },
    cancelPromotion: () => setPendingPromotion(null),
    undo,
    redo,
    reset,
    flip: () => {
      setOrientation((o) => {
        const next = o === "white" ? "black" : "white";
        persistPrefs({ orientation: next });
        return next;
      });
    },
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
    canDragPiece: dragGuard,
    mode,
    setMode,
    humanColor: effectiveHuman ?? humanColor,
    setHumanColor,
    difficulty,
    setDifficulty,
    soundOn,
    setSoundOn,
    thinking,
    isPlayerTurn,
    localResult,
    drawOffer,
    dismissDrawOffer: () => setDrawOffer(null),
    resign,
    offerDraw,
    acceptDraw,
    stage,
    puzzle,
    stageId,
    puzzleId,
    puzzleState,
    hintUsed,
    progress,
    stageProgress,
    overallProgress,
    stages: STAGES,
    openStage,
    retryPuzzle,
    goNextPuzzle,
    unlockSounds,
    deselect: () => {
      setSelected(null);
      setArrowDraft(null);
      setPendingPromotion(null);
    },
  };
}
