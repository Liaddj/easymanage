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
  let scoreSum = 0;
  for (const stage of stages) {
    const stats = stageStats(stage, progress);
    total += stats.total;
    solved += stats.solved;
    scoreSum += stageScore(stage, progress);
  }
  const percent = total === 0 ? 0 : Math.round((solved / total) * 100);
  const score = stages.length === 0 ? 0 : Math.round(scoreSum / stages.length);
  return { total, solved, percent, score };
}

export function puzzleScore(record) {
  if (!record?.solved) return 0;
  if ((record.failedAttempts ?? 0) === 0) return 100;
  if (record.failedAttempts === 1) return 80;
  if (record.failedAttempts === 2) return 60;
  return 40;
}

export function stageScore(stage, progress) {
  if (!stage.puzzles.length) return 0;
  const total = stage.puzzles.reduce((sum, puzzle) => sum + puzzleScore(progress.puzzles[puzzle.id]), 0);
  return Math.round(total / stage.puzzles.length);
}

export function isStageUnlocked(stages, stageId, progress) {
  const index = stages.findIndex((stage) => stage.id === stageId);
  if (index <= 0) return true;
  return stageStats(stages[index - 1], progress).complete;
}

export function stageStatus(stages, stage, progress, currentStageId) {
  const stats = stageStats(stage, progress);
  if (stats.complete) return "complete";
  if (!isStageUnlocked(stages, stage.id, progress)) return "locked";
  if (stage.id === currentStageId) return "in_progress";
  if (stats.solved > 0) return "in_progress";
  return "ready";
}

export function firstOpenPuzzle(stage, progress) {
  return stage.puzzles.find((puzzle) => !progress.puzzles[puzzle.id]?.solved)?.id ?? stage.puzzles[0]?.id;
}

export function dashboardRows(stages, progress, currentStageId) {
  return stages.map((stage) => {
    const stats = stageStats(stage, progress);
    const checks = stage.puzzles.map((puzzle) => Boolean(progress.puzzles[puzzle.id]?.solved));
    return {
      id: stage.id,
      title: stage.title,
      status: stageStatus(stages, stage, progress, currentStageId),
      unlocked: isStageUnlocked(stages, stage.id, progress),
      solved: stats.solved,
      total: stats.total,
      percent: stats.total === 0 ? 0 : Math.round((stats.solved / stats.total) * 100),
      score: stageScore(stage, progress),
      checks,
    };
  });
}
