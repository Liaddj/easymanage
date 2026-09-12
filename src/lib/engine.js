import { Chess } from "chess.js";
import { evaluatePosition } from "./evaluate.js";

/**
 * In-browser computer opponent: minimax + alpha-beta on a fast heuristic.
 * No WASM, no network. Difficulty only changes depth / noise — never rules.
 */

export const DIFFICULTIES = ["easy", "medium", "hard"];

const DEPTH = { easy: 1, medium: 2, hard: 3 };

const PST = {
  p: [
    0, 0, 0, 0, 0, 0, 0, 0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
    5, 5, 10, 25, 25, 10, 5, 5,
    0, 0, 0, 20, 20, 0, 0, 0,
    5, -5, -10, 0, 0, -10, -5, 5,
    5, 10, 10, -20, -20, 10, 10, 5,
    0, 0, 0, 0, 0, 0, 0, 0,
  ],
  n: [
    -50, -40, -30, -30, -30, -30, -40, -50,
    -40, -20, 0, 0, 0, 0, -20, -40,
    -30, 0, 10, 15, 15, 10, 0, -30,
    -30, 5, 15, 20, 20, 15, 5, -30,
    -30, 0, 15, 20, 20, 15, 0, -30,
    -30, 5, 10, 15, 15, 10, 5, -30,
    -40, -20, 0, 5, 5, 0, -20, -40,
    -50, -40, -30, -30, -30, -30, -40, -50,
  ],
  b: [
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 10, 10, 5, 0, -10,
    -10, 5, 5, 10, 10, 5, 5, -10,
    -10, 0, 10, 10, 10, 10, 0, -10,
    -10, 10, 10, 10, 10, 10, 10, -10,
    -10, 5, 0, 0, 0, 0, 5, -10,
    -20, -10, -10, -10, -10, -10, -10, -20,
  ],
  r: [
    0, 0, 0, 0, 0, 0, 0, 0,
    5, 10, 10, 10, 10, 10, 10, 5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    0, 0, 0, 5, 5, 0, 0, 0,
  ],
  q: [
    -20, -10, -10, -5, -5, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 5, 5, 5, 0, -10,
    -5, 0, 5, 5, 5, 5, 0, -5,
    0, 0, 5, 5, 5, 5, 0, -5,
    -10, 5, 5, 5, 5, 5, 0, -10,
    -10, 0, 5, 0, 0, 0, 0, -10,
    -20, -10, -10, -5, -5, -10, -10, -20,
  ],
  k: [
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -20, -30, -30, -40, -40, -30, -30, -20,
    -10, -20, -20, -20, -20, -20, -20, -10,
    20, 20, 0, 0, 0, 0, 20, 20,
    20, 30, 10, 0, 0, 10, 30, 20,
  ],
};

const MATERIAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

function pstIndex(rank, file, color) {
  return color === "w" ? rank * 8 + file : (7 - rank) * 8 + file;
}

/** Fast leaf eval used inside search (skips mobility Chess clones). */
export function evaluateFast(chess) {
  if (chess.isCheckmate()) return chess.turn() === "w" ? -20_000 : 20_000;
  if (chess.isDraw() || chess.isStalemate()) return 0;

  let score = 0;
  const board = chess.board();
  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const piece = board[rank][file];
      if (!piece) continue;
      const sign = piece.color === "w" ? 1 : -1;
      score += sign * MATERIAL[piece.type];
      const table = PST[piece.type];
      if (table) score += sign * table[pstIndex(rank, file, piece.color)];
    }
  }
  if (chess.isCheck()) score += chess.turn() === "w" ? -18 : 18;
  return score;
}

function moveScore(move) {
  let score = 0;
  if (move.captured) score += 10 + (MATERIAL[move.captured] ?? 0) / 10;
  if (move.promotion) score += 80;
  if (move.san === "O-O" || move.san === "O-O-O") score += 12;
  if (move.san.includes("+")) score += 8;
  return score;
}

function orderedMoves(chess) {
  return chess.moves({ verbose: true }).sort((a, b) => moveScore(b) - moveScore(a));
}

function minimax(chess, depth, alpha, beta, maximizing) {
  if (depth === 0 || chess.isGameOver()) return evaluateFast(chess);

  const moves = orderedMoves(chess);
  if (!moves.length) return evaluateFast(chess);

  if (maximizing) {
    let best = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const score = minimax(chess, depth - 1, alpha, beta, false);
      chess.undo();
      if (score > best) best = score;
      if (score > alpha) alpha = score;
      if (beta <= alpha) break;
    }
    return best;
  }

  let best = Infinity;
  for (const move of moves) {
    chess.move(move);
    const score = minimax(chess, depth - 1, alpha, beta, true);
    chess.undo();
    if (score < best) best = score;
    if (score < beta) beta = score;
    if (beta <= alpha) break;
  }
  return best;
}

function pickRandom(moves) {
  return moves[Math.floor(Math.random() * moves.length)];
}

/**
 * Choose a legal computer move for `fen` at the given difficulty.
 * Easy: noisy 1-ply (often blunders). Medium/hard: alpha-beta.
 */
export function pickComputerMove(fen, difficulty = "medium") {
  const chess = new Chess(fen);
  const legal = orderedMoves(chess);
  if (!legal.length) return null;

  const level = DIFFICULTIES.includes(difficulty) ? difficulty : "medium";

  if (level === "easy") {
    // Prefer captures/checks ~40% of the time; otherwise a random legal move.
    const spicy = legal.filter((m) => m.captured || m.san.includes("+") || m.promotion);
    if (spicy.length && Math.random() < 0.4) return pickRandom(spicy);
    if (Math.random() < 0.55) return pickRandom(legal);
    // Shallow greedy as a fallback so it is not purely random.
  }

  const depth = DEPTH[level];
  const maximizing = chess.turn() === "w";
  let bestMoves = [];
  let bestScore = maximizing ? -Infinity : Infinity;

  for (const move of legal) {
    chess.move(move);
    const score = minimax(chess, depth - 1, -Infinity, Infinity, !maximizing);
    chess.undo();
    if (maximizing ? score > bestScore : score < bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  if (level === "easy" && bestMoves.length) {
    // Mix the greedy choice with a weaker sibling so Easy stays beatable.
    if (Math.random() < 0.45) return pickRandom(legal);
  }

  return pickRandom(bestMoves.length ? bestMoves : legal);
}

export function thinkDelayMs(difficulty) {
  if (difficulty === "hard") return 700;
  if (difficulty === "easy") return 380;
  return 520;
}

/** Computer accepts a local draw offer when the heuristic is close to even. */
export function computerAcceptsDraw(fen, difficulty = "medium") {
  const chess = new Chess(fen);
  const score = Math.abs(evaluatePosition(chess));
  const threshold = difficulty === "easy" ? 180 : difficulty === "hard" ? 45 : 90;
  return score <= threshold;
}
