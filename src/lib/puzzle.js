import { Chess } from "chess.js";
import { assertLegalTurn } from "./turns.js";

export function stripSan(san) {
  return (san ?? "").replace(/[+#?!]/g, "");
}

export function sameSan(a, b) {
  if (!a || !b) return false;
  return a === b || stripSan(a) === stripSan(b);
}

export function legalBySan(fen, san) {
  const chess = new Chess(fen);
  return chess.moves({ verbose: true }).find((m) => sameSan(m.san, san)) ?? null;
}

/**
 * Grade a human attempt against the current puzzle step.
 * `step` is the index into `puzzle.solution` that the human must find
 * (opponent replies are even/odd depending on who moved first).
 */
export function gradePuzzleMove(puzzle, fen, from, to, promotion) {
  const humanColor = new Chess(fen).turn();
  const attempt = assertLegalTurn({
    fen,
    from,
    to,
    promotion,
    mode: "puzzle",
    humanColor,
    actor: "human",
  });
  if (!attempt.ok) return { ok: false, correct: false, reason: attempt.reason };

  const expectedSan = puzzle.solution[puzzle.step ?? 0];
  const alts = puzzle.alts ?? [];
  const correct =
    sameSan(attempt.move.san, expectedSan) ||
    alts.some((san) => sameSan(attempt.move.san, san));

  return {
    ok: true,
    correct,
    reason: correct ? "solved-step" : "wrong-move",
    move: attempt.move,
    fen: attempt.fen,
    expected: expectedSan,
  };
}

/** After a correct human step, auto-play the next SAN if it is the opponent's reply. */
export function nextAutoReply(puzzle, fenAfterHuman, humanStep) {
  const replySan = puzzle.solution[humanStep + 1];
  if (!replySan) return null;
  const reply = legalBySan(fenAfterHuman, replySan);
  if (!reply) return null;
  // Only auto-play if that SAN belongs to the side now to move.
  const turn = new Chess(fenAfterHuman).turn();
  if (reply.color !== turn) return null;
  return reply;
}

export function isPuzzleComplete(puzzle, humanStepsPlayed) {
  const humanMoves = puzzle.solution.filter((_, i) => i % 2 === 0);
  return humanStepsPlayed >= humanMoves.length;
}
