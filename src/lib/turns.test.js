import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { START_FEN } from "./board.js";
import { assertLegalTurn, canSelectSquare, redoSteps, undoSteps } from "./turns.js";

const start = START_FEN;

describe("turn enforcement", () => {
  it("rejects moving a Black piece on White's turn", () => {
    const result = assertLegalTurn({
      fen: start,
      from: "e7",
      to: "e5",
      mode: "free",
      humanColor: "w",
      actor: "human",
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("wrongTurn");
  });

  it("rejects selecting an opponent piece", () => {
    const chess = new Chess(start);
    expect(
      canSelectSquare({
        chess,
        square: "e7",
        mode: "computer",
        humanColor: "w",
        thinking: false,
        gameOver: false,
      }),
    ).toBe(false);
    expect(
      canSelectSquare({
        chess,
        square: "e2",
        mode: "computer",
        humanColor: "w",
        thinking: false,
        gameOver: false,
      }),
    ).toBe(true);
  });

  it("blocks the human while it is the computer's turn", () => {
    const afterWhite = new Chess(start);
    afterWhite.move("e4");
    const result = assertLegalTurn({
      fen: afterWhite.fen(),
      from: "e4",
      to: "e5",
      mode: "computer",
      humanColor: "w",
      actor: "human",
    });
    expect(result.ok).toBe(false);
    expect(["notYourTurn", "wrongTurn", "illegal"]).toContain(result.reason);
  });

  it("blocks the computer from moving on the human's turn", () => {
    const result = assertLegalTurn({
      fen: start,
      from: "e2",
      to: "e4",
      mode: "computer",
      humanColor: "w",
      actor: "computer",
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("notYourTurn");
  });

  it("accepts a legal White opening and rejects an illegal leap", () => {
    const legal = assertLegalTurn({
      fen: start,
      from: "e2",
      to: "e4",
      mode: "computer",
      humanColor: "w",
      actor: "human",
    });
    expect(legal.ok).toBe(true);
    expect(legal.move.san).toBe("e4");

    const illegal = assertLegalTurn({
      fen: start,
      from: "e2",
      to: "e5",
      mode: "computer",
      humanColor: "w",
      actor: "human",
    });
    expect(illegal.ok).toBe(false);
    expect(illegal.reason).toBe("illegal");
  });

  it("never allows a move after checkmate", () => {
    const mate = new Chess("6k1/5ppp/8/8/8/8/5PPP/1R4K1 w - - 0 1");
    mate.move("Rb8#");
    const result = assertLegalTurn({
      fen: mate.fen(),
      from: "g8",
      to: "h8",
      mode: "free",
      humanColor: "b",
      actor: "human",
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("gameOver");
  });

  it("undoes a pair vs the computer once it has answered", () => {
    expect(
      undoSteps({ mode: "computer", cursor: 2, turn: "w", humanColor: "w", thinking: false }),
    ).toBe(2);
    expect(
      undoSteps({ mode: "computer", cursor: 1, turn: "b", humanColor: "w", thinking: true }),
    ).toBe(1);
    expect(undoSteps({ mode: "free", cursor: 3, turn: "b", humanColor: "w", thinking: false })).toBe(1);
    expect(redoSteps({ mode: "computer", remaining: 3 })).toBe(2);
  });
});
