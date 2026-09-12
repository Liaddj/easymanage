import { useMemo } from "react";
import { Chessboard } from "react-chessboard";

/**
 * Square styling for last-move, selection, legal dots, checks, and threats.
 * Legal-move dots use a radial gradient so pieces still show through.
 */
function buildSquareStyles({ selected, legalMoves, lastMove, threats, game, arrowDraft, coachMode }) {
  const styles = {};

  const paint = (square, extra) => {
    styles[square] = { ...(styles[square] ?? {}), ...extra };
  };

  if (lastMove) {
    paint(lastMove.from, { backgroundColor: "rgba(168, 85, 247, 0.30)" });
    paint(lastMove.to, { backgroundColor: "rgba(168, 85, 247, 0.42)" });
  }

  if (game.isCheck()) {
    const board = game.board();
    for (let rank = 0; rank < 8; rank += 1) {
      for (let file = 0; file < 8; file += 1) {
        const piece = board[rank][file];
        if (piece?.type === "k" && piece.color === game.turn()) {
          paint(`${"abcdefgh"[file]}${8 - rank}`, {
            background: "radial-gradient(circle at center, rgba(251,113,133,0.62) 0%, rgba(251,113,133,0.08) 70%)",
          });
        }
      }
    }
  }

  if (coachMode) {
    for (const square of threats) {
      paint(square, { animation: "threat-pulse 1.55s ease-in-out infinite" });
    }
  }

  if (selected) {
    paint(selected, { backgroundColor: "rgba(34, 211, 238, 0.42)" });
  }

  if (arrowDraft) {
    paint(arrowDraft, { boxShadow: "inset 0 0 0 2px rgba(192,132,252,0.85)" });
  }

  for (const move of legalMoves) {
    const isCapture = Boolean(move.captured);
    paint(move.to, {
      backgroundImage: isCapture
        ? "radial-gradient(circle at center, transparent 0 56%, rgba(251,113,133,0.72) 58% 100%)"
        : "radial-gradient(circle at center, rgba(34,211,238,0.88) 0 14%, transparent 16%)",
      backgroundRepeat: "no-repeat",
    });
  }

  return styles;
}

export default function ChessGameBoard({ gameState }) {
  const {
    fen,
    game,
    lastMove,
    selected,
    legalMoves,
    threats,
    orientation,
    coachMode,
    arrows,
    arrowDraft,
    tryMove,
    handleSquareClick,
    gameOver,
    pendingPromotion,
    arrowMode,
  } = gameState;

  const squareStyles = useMemo(
    () =>
      buildSquareStyles({
        selected,
        legalMoves,
        lastMove,
        threats,
        game,
        arrowDraft,
        coachMode,
      }),
    [arrowDraft, coachMode, game, lastMove, legalMoves, selected, threats],
  );

  const options = useMemo(
    () => ({
      id: "maestro-board",
      position: fen,
      boardOrientation: orientation,
      animationDurationInMs: 280,
      showAnimations: true,
      allowDragging: !gameOver && !pendingPromotion && !arrowMode,
      allowDrawingArrows: !arrowMode,
      clearArrowsOnClick: true,
      clearArrowsOnPositionChange: true,
      arrows,
      arrowOptions: {
        colors: {
          default: "#c084fc",
          shift: "#22d3ee",
          ctrl: "#fb7185",
          alt: "#a3e635",
        },
        color: "#c084fc",
        opacity: 0.85,
      },
      // Right-drag arrows live in the board's internal state. We only pass
      // coach / hint / tap-mode arrows here so they are not drawn twice.
      squareStyles,
      darkSquareStyle: { backgroundColor: "#16122b" },
      lightSquareStyle: { backgroundColor: "#2a3560" },
      dropSquareStyle: { boxShadow: "inset 0 0 0 3px rgba(34,211,238,0.7)" },
      boardStyle: {
        borderRadius: "14px",
        overflow: "hidden",
        boxShadow:
          "0 0 0 1px rgba(34,211,238,0.22), 0 0 42px rgba(168,85,247,0.16), 0 22px 50px rgba(0,0,0,0.45)",
        width: "100%",
        height: "100%",
      },
      darkSquareNotationStyle: { color: "rgba(34,211,238,0.5)", fontWeight: 600 },
      lightSquareNotationStyle: { color: "rgba(192,132,252,0.45)", fontWeight: 600 },
      onPieceDrop: ({ sourceSquare, targetSquare }) => {
        if (!targetSquare) return false;
        return tryMove(sourceSquare, targetSquare);
      },
      onSquareClick: ({ square }) => handleSquareClick(square),
      canDragPiece: ({ piece }) => {
        if (!piece?.pieceType) return false;
        return piece.pieceType[0] === game.turn();
      },
    }),
    [
      arrowMode,
      arrows,
      fen,
      game,
      gameOver,
      handleSquareClick,
      orientation,
      pendingPromotion,
      squareStyles,
      tryMove,
    ],
  );

  return (
    <div className="board-ltr board-frame relative mx-auto">
      <div className="h-full w-full overflow-hidden rounded-[13px] bg-void">
        <Chessboard options={options} />
      </div>
    </div>
  );
}
