import { Chess } from "chess.js";

/** Starting position FEN (chess.js default). */
export const START_FEN = new Chess().fen();

export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

export const PIECE_VALUES = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

export const UNICODE = {
  w: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
  b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
};

export function opposite(color) {
  return color === "w" ? "b" : "w";
}

/** Convert chess.js board indices (rank 0 = 8th rank) to algebraic. */
export function squareFromIndex(file, rank) {
  return `${FILES[file]}${8 - rank}`;
}

export function findKing(chess, color) {
  const board = chess.board();
  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const piece = board[rank][file];
      if (piece?.type === "k" && piece.color === color) {
        return squareFromIndex(file, rank);
      }
    }
  }
  return null;
}

/**
 * True when a pawn move needs a promotion piece before chess.js will accept it.
 */
export function needsPromotion(chess, from, to) {
  const piece = chess.get(from);
  if (!piece || piece.type !== "p") return false;
  const destRank = to[1];
  return (piece.color === "w" && destRank === "8") || (piece.color === "b" && destRank === "1");
}

/**
 * Squares occupied by the side to move that are attacked by the opponent.
 * Used for the pulsing red threat indicators in Coach Mode.
 */
export function collectThreats(chess) {
  const us = chess.turn();
  const them = opposite(us);
  const threatened = [];
  const board = chess.board();

  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const piece = board[rank][file];
      if (!piece || piece.color !== us) continue;
      const square = squareFromIndex(file, rank);
      if (chess.isAttacked(square, them)) threatened.push(square);
    }
  }
  return threatened;
}

/**
 * Find opponent pieces that currently attack `target`.
 * Temporarily sets the side-to-move so chess.js will generate those captures.
 */
export function findAttackers(chess, target, byColor) {
  const parts = chess.fen().split(" ");
  parts[1] = byColor;
  let attackerSide;
  try {
    attackerSide = new Chess(parts.join(" "));
  } catch {
    return [];
  }

  const attackers = [];
  const board = chess.board();
  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const piece = board[rank][file];
      if (!piece || piece.color !== byColor) continue;
      const square = squareFromIndex(file, rank);
      const hits = attackerSide.moves({ square, verbose: true }).some((move) => move.to === target);
      if (hits) attackers.push(square);
    }
  }
  return attackers;
}

/** Attacked by the opponent and not defended — a hanging piece. */
export function isHanging(chess, square) {
  const piece = chess.get(square);
  if (!piece) return false;
  const them = opposite(piece.color);
  return chess.isAttacked(square, them) && !chess.isAttacked(square, piece.color);
}

function countArmy(chess) {
  const now = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0 },
  };
  for (const row of chess.board()) {
    for (const piece of row) {
      if (piece && piece.type !== "k") now[piece.color][piece.type] += 1;
    }
  }
  return now;
}

/** Missing pieces relative to the game's starting army (standard or puzzle FEN). */
export function capturedPieces(chess, startFen = START_FEN) {
  let start;
  try {
    start = countArmy(new Chess(startFen));
  } catch {
    start = { w: { p: 8, n: 2, b: 2, r: 2, q: 1 }, b: { p: 8, n: 2, b: 2, r: 2, q: 1 } };
  }
  const now = countArmy(chess);

  const taken = { w: [], b: [] };
  for (const type of ["q", "r", "b", "n", "p"]) {
    for (const color of ["w", "b"]) {
      const missing = start[color][type] - now[color][type];
      for (let i = 0; i < missing; i += 1) taken[color].push({ color, type });
    }
  }
  return taken;
}

export function materialDiff(chess) {
  let score = 0;
  for (const row of chess.board()) {
    for (const piece of row) {
      if (!piece) continue;
      const value = PIECE_VALUES[piece.type];
      score += piece.color === "w" ? value : -value;
    }
  }
  return score;
}

export function pairMoves(history, startTurn = "w") {
  const pairs = [];
  if (startTurn === "b") {
    if (!history.length) return pairs;
    pairs.push({ n: 1, white: "…", black: history[0] ?? "" });
    for (let i = 1; i < history.length; i += 2) {
      pairs.push({
        n: Math.floor(i / 2) + 2,
        white: history[i] ?? "",
        black: history[i + 1] ?? "",
      });
    }
    return pairs;
  }
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({
      n: i / 2 + 1,
      white: history[i] ?? "",
      black: history[i + 1] ?? "",
    });
  }
  return pairs;
}

export function statusFromGame(chess, localResult = null) {
  if (localResult) return localResult;
  if (chess.isCheckmate()) return chess.turn() === "w" ? "blackWins" : "whiteWins";
  if (chess.isStalemate()) return "stalemate";
  if (chess.isDraw()) return "draw";
  if (chess.isCheck()) return "check";
  return chess.turn() === "w" ? "whiteToMove" : "blackToMove";
}
