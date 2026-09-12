import { Chess } from "chess.js";

/**
 * Pure turn / legality helpers. Every human and computer move is gated here
 * so the UI cannot play illegal moves or move the opponent's pieces.
 */

export function sideFromPieceType(pieceType) {
  if (!pieceType) return null;
  const flag = pieceType[0];
  if (flag === "w" || flag === "b") return flag;
  return null;
}

export function isPlayersColor(color, humanColor, mode) {
  if (mode === "free") return true;
  return color === humanColor;
}

/**
 * Whether the user may select (and later drag) the piece on `square`.
 * Opponent pieces are never selectable. In vs-computer / puzzle modes the
 * human may only select their own color, and only on their turn.
 */
export function canSelectSquare({ chess, square, mode, humanColor, thinking, gameOver }) {
  if (gameOver || thinking) return false;
  const piece = chess.get(square);
  if (!piece) return false;
  if (piece.color !== chess.turn()) return false;
  if (!isPlayersColor(piece.color, humanColor, mode)) return false;
  return true;
}

export function canDragPiece({ pieceType, turn, mode, humanColor, thinking, gameOver, arrowMode, pendingPromotion }) {
  if (gameOver || thinking || arrowMode || pendingPromotion) return false;
  const color = sideFromPieceType(pieceType);
  if (!color || color !== turn) return false;
  return isPlayersColor(color, humanColor, mode);
}

/**
 * Attempt a move under strict rules. Returns `{ ok, reason, move, fen }`.
 * `reason` is a stable token for tests and UI: thinking | gameOver |
 * empty | wrongTurn | notYourPiece | notYourTurn | illegal.
 */
export function assertLegalTurn({
  fen,
  from,
  to,
  promotion,
  mode,
  humanColor,
  thinking = false,
  actor = "human",
}) {
  if (thinking && actor === "human") return { ok: false, reason: "thinking" };

  let chess;
  try {
    chess = new Chess(fen);
  } catch {
    return { ok: false, reason: "illegal" };
  }

  if (chess.isGameOver()) return { ok: false, reason: "gameOver" };

  const piece = chess.get(from);
  if (!piece) return { ok: false, reason: "empty" };
  if (piece.color !== chess.turn()) return { ok: false, reason: "wrongTurn" };

  if (actor === "human") {
    if (!isPlayersColor(piece.color, humanColor, mode)) {
      return { ok: false, reason: "notYourPiece" };
    }
    if (mode !== "free" && chess.turn() !== humanColor) {
      return { ok: false, reason: "notYourTurn" };
    }
  }

  if (actor === "computer") {
    if (mode !== "computer") return { ok: false, reason: "notYourTurn" };
    if (chess.turn() === humanColor) return { ok: false, reason: "notYourTurn" };
  }

  let applied = null;
  try {
    applied = chess.move({ from, to, promotion: promotion || undefined });
  } catch {
    applied = null;
  }
  if (!applied) return { ok: false, reason: "illegal" };

  return { ok: true, move: applied, fen: chess.fen() };
}

/** How many timeline steps undo should rewind in this position. */
export function undoSteps({ mode, cursor, turn, humanColor, thinking }) {
  if (cursor <= 0) return 0;
  if (mode !== "computer") return 1;
  if (thinking) return 1;
  if (cursor === 1) return 1;
  // After a completed exchange it is the human's turn — rewind the pair.
  if (turn === humanColor) return 2;
  return 1;
}

export function redoSteps({ mode, remaining }) {
  if (remaining <= 0) return 0;
  if (mode !== "computer") return 1;
  return remaining >= 2 ? 2 : 1;
}
