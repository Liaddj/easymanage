import { describe, expect, it } from "vitest";
import { STAGES } from "./curriculum.js";
import { dashboardRows, isStageUnlocked, puzzleScore, stageStatus } from "./progress.js";

describe("stage lessons", () => {
  it("gives every stage English learn / why / how copy", () => {
    for (const stage of STAGES) {
      expect(stage.learn?.en?.length).toBeGreaterThan(20);
      expect(stage.why?.en?.length).toBeGreaterThan(20);
      expect(stage.how?.en?.length).toBeGreaterThan(20);
    }
  });
});

describe("curriculum progress", () => {
  it("unlocks only the first stage until the previous one is complete", () => {
    const empty = { puzzles: {} };
    expect(isStageUnlocked(STAGES, "tactics-forks", empty)).toBe(true);
    expect(isStageUnlocked(STAGES, "tactics-pins", empty)).toBe(false);

    const forksDone = {
      puzzles: Object.fromEntries(STAGES[0].puzzles.map((p) => [p.id, { solved: true, failedAttempts: 0 }])),
    };
    expect(isStageUnlocked(STAGES, "tactics-pins", forksDone)).toBe(true);
    expect(isStageUnlocked(STAGES, "tactics-skewers", forksDone)).toBe(false);
  });

  it("scores a first-try solve at 100 and marks dashboard rows", () => {
    expect(puzzleScore({ solved: true, failedAttempts: 0 })).toBe(100);
    expect(puzzleScore({ solved: true, failedAttempts: 2 })).toBe(60);

    const progress = {
      puzzles: { "fork-royal-knight": { solved: true, failedAttempts: 0 } },
    };
    const rows = dashboardRows(STAGES, progress, "tactics-forks");
    expect(rows[0].status).toBe("in_progress");
    expect(rows[0].solved).toBe(1);
    expect(rows[0].checks[0]).toBe(true);
    expect(rows[1].status).toBe("locked");
    expect(stageStatus(STAGES, STAGES[0], progress, "tactics-forks")).toBe("in_progress");
  });
});
