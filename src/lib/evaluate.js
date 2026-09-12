import { Chess } from "chess.js";

/**
 * Lightweight in-browser evaluation — no engine, no network.
 * Combines material, center occupation, piece development, and mobility.
 * Positive = White advantage (centipawns-ish).
 */

const MATERIAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

export const CENTER = new Set(["d4", "d5", "e4", "e5"]);
export const EXTENDED = new Set(["c3", "c4", "c5", "c6", "d3", "d6", "e3", "e6", "f3", "f4", "f5", "f6"]);

function squareOf(file, rank) {
  return `${"abcdefgh"[file]}${8 - rank}`;
}

export function evaluatePosition(chess) {
  if (chess.isCheckmate()) return chess.turn() === "w" ? -12_000 : 12_000;
  if (chess.isDraw() || chess.isStalemate()) return 0;

  let material = 0;
  let center = 0;
  let development = 0;
  let kingSafety = 0;

  const board = chess.board();
  const ply = chess.history().length;

  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const piece = board[rank][file];
      if (!piece) continue;
      const sign = piece.color === "w" ? 1 : -1;
      material += sign * MATERIAL[piece.type];

      const square = squareOf(file, rank);
      if (CENTER.has(square)) center += sign * (piece.type === "p" ? 28 : 16);
      else if (EXTENDED.has(square)) center += sign * (piece.type === "p" ? 10 : 6);

      // Reward knights/bishops leaving the back rank in the opening.
      if ((piece.type === "n" || piece.type === "b") && ply < 24) {
        const back = piece.color === "w" ? 7 : 0;
        if (rank !== back) development += sign * 18;
      }

      // Early queen excursions are slightly suspicious.
      if (piece.type === "q" && ply < 12) {
        const homeFile = 3;
        if (file !== homeFile) development -= sign * 12;
      }
    }
  }

  // Castled kings are safer; uncastled kings in the center after move 8 are not.
  for (const color of ["w", "b"]) {
    const sign = color === "w" ? 1 : -1;
    const kingRank = color === "w" ? 7 : 0;
    const kingFile = board[kingRank]?.findIndex((cell) => cell?.type === "k" && cell.color === color);
    if (kingFile === 6 || kingFile === 2) kingSafety += sign * 40;
    else if (ply >= 16 && kingFile === 4) kingSafety -= sign * 22;
  }

  // Mobility: legal moves for the side to move, cheap estimate for the other side.
  const usMoves = chess.moves().length;
  const fenParts = chess.fen().split(" ");
  fenParts[1] = chess.turn() === "w" ? "b" : "w";
  let themMoves = 0;
  try {
    themMoves = new Chess(fenParts.join(" ")).moves().length;
  } catch {
    themMoves = usMoves;
  }
  const mobility = (usMoves - themMoves) * (chess.turn() === "w" ? 2 : -2);

  return material + center + development + kingSafety + mobility;
}

/** Map a raw score onto 0 (Black winning) … 100 (White winning) for the eval bar. */
export function scoreToWhitePercent(score) {
  const clamped = Math.max(-900, Math.min(900, score));
  return 50 + (clamped / 900) * 50;
}

/**
 * One-ply greedy suggestion used by the Hint button.
 * Searches all legal moves with the same heuristic — fast enough for a browser.
 */
export function suggestMove(chess) {
  const legal = chess.moves({ verbose: true });
  if (!legal.length) return null;

  const sign = chess.turn() === "w" ? 1 : -1;
  let best = legal[0];
  let bestScore = -Infinity;

  for (const move of legal) {
    const next = new Chess(chess.fen());
    next.move(move);
    let score = evaluatePosition(next) * sign;
    if (move.captured) score += 18 + (MATERIAL[move.captured] ?? 0) / 20;
    if (next.isCheck()) score += 14;
    if (CENTER.has(move.to)) score += 8;
    if (move.san === "O-O" || move.san === "O-O-O") score += 24;
    if (score > bestScore) {
      bestScore = score;
      best = move;
    }
  }

  return best;
}
