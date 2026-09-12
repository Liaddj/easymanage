const KEY = "maestro_progress_v1";

const EMPTY = {
  version: 1,
  puzzles: {},
  lastStageId: "tactics-forks",
  lastPuzzleId: "fork-royal-knight",
};

function canUseStorage() {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}

export function loadProgress() {
  if (!canUseStorage()) return { ...EMPTY, puzzles: {} };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY, puzzles: {} };
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1 || typeof parsed.puzzles !== "object") {
      return { ...EMPTY, puzzles: {} };
    }
    return {
      ...EMPTY,
      ...parsed,
      puzzles: parsed.puzzles ?? {},
    };
  } catch {
    return { ...EMPTY, puzzles: {} };
  }
}

export function saveProgress(progress) {
  if (!canUseStorage()) return progress;
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    // Private mode / quota — progress simply does not persist.
  }
  return progress;
}

export function markPuzzleResult(progress, puzzleId, solved) {
  const prev = progress.puzzles[puzzleId] ?? { solved: false, failedAttempts: 0 };
  const next = {
    ...progress,
    puzzles: {
      ...progress.puzzles,
      [puzzleId]: {
        solved: prev.solved || solved,
        failedAttempts: prev.failedAttempts + (solved ? 0 : 1),
        solvedAt: solved ? new Date().toISOString() : prev.solvedAt ?? null,
      },
    },
  };
  return saveProgress(next);
}

export function rememberLocation(progress, stageId, puzzleId) {
  return saveProgress({ ...progress, lastStageId: stageId, lastPuzzleId: puzzleId });
}

export function stageStats(stage, progress) {
  const total = stage.puzzles.length;
  const solved = stage.puzzles.filter((puzzle) => progress.puzzles[puzzle.id]?.solved).length;
  return { total, solved, complete: total > 0 && solved === total };
}

export function pathStats(stages, progress) {
  let total = 0;
  let solved = 0;
  for (const stage of stages) {
    const stats = stageStats(stage, progress);
    total += stats.total;
    solved += stats.solved;
  }
  return { total, solved };
}
