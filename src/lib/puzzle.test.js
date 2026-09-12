import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { STAGES } from "./curriculum.js";
import { gradePuzzleMove, legalBySan, sameSan } from "./puzzle.js";
import { pickComputerMove } from "./engine.js";

describe("curriculum puzzles", () => {
  it("every solution SAN is legal from the puzzle FEN (and replies continue the line)", () => {
    for (const stage of STAGES) {
      for (const puzzle of stage.puzzles) {
        const chess = new Chess(puzzle.fen);
        for (const san of puzzle.solution) {
          const move = legalBySan(chess.fen(), san);
          expect(move, `${puzzle.id} expected legal ${san} in ${chess.fen()}`).toBeTruthy();
          chess.move(move);
        }
      }
    }
  });

  it("solves the royal-knight-fork puzzle and rejects a wrong try", () => {
    const puzzle = STAGES[0].puzzles[0];
    expect(puzzle.id).toBe("fork-royal-knight");

    const miss = gradePuzzleMove(puzzle, puzzle.fen, "d4", "c2");
    expect(miss.ok).toBe(true);
    expect(miss.correct).toBe(false);

    const hit = gradePuzzleMove(puzzle, puzzle.fen, "d4", "f3");
    expect(hit.ok).toBe(true);
    expect(hit.correct).toBe(true);
    expect(sameSan(hit.move.san, "Nf3+")).toBe(true);

    const after = new Chess(hit.fen);
    expect(after.isCheck()).toBe(true);
    expect(after.get("d2")?.type).toBe("q");
    expect(after.isAttacked("d2", "b")).toBe(true);
  });

  it("computer only returns a legal move for the side to move", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
    const move = pickComputerMove(fen, "easy");
    expect(move).toBeTruthy();
    const chess = new Chess(fen);
    expect(move.color).toBe("b");
    expect(chess.move({ from: move.from, to: move.to, promotion: move.promotion })).toBeTruthy();
  });
});
