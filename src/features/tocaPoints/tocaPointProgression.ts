export type TocaPointProgress = {
  currentLevel: number;
  currentLevelRequiredTp: number;
  nextLevel: number;
  nextLevelRequiredTp: number;
  pointsInCurrentLevel: number;
  pointsToNextLevel: number;
  progressToNextLevel: number;
  totalTp: number;
};

const maxTocaLevelSearch = 1000;

export function requiredTpForLevel(level: number) {
  if (level <= 1) {
    return 0;
  }

  const n = level - 1;

  return Math.round((12.35 * n * n + 489 * n - 321.35) / 10) * 10;
}

export function getTocaLevel(totalTp: number) {
  const normalizedTp = normalizeTp(totalTp);
  let level = 1;

  while (level < maxTocaLevelSearch && normalizedTp >= requiredTpForLevel(level + 1)) {
    level += 1;
  }

  return level;
}

export function getCurrentLevelRequiredTp(totalTp: number) {
  return requiredTpForLevel(getTocaLevel(totalTp));
}

export function getNextLevelRequiredTp(totalTp: number) {
  return requiredTpForLevel(getTocaLevel(totalTp) + 1);
}

export function getProgressToNextLevel(totalTp: number) {
  return getTocaPointProgress(totalTp).progressToNextLevel;
}

export function getPointsToNextLevel(totalTp: number) {
  return getTocaPointProgress(totalTp).pointsToNextLevel;
}

export function getTocaPointProgress(totalTp: number): TocaPointProgress {
  const normalizedTp = normalizeTp(totalTp);
  const currentLevel = getTocaLevel(normalizedTp);
  const nextLevel = currentLevel + 1;
  const currentLevelRequiredTp = requiredTpForLevel(currentLevel);
  const nextLevelRequiredTp = requiredTpForLevel(nextLevel);
  const levelSpan = Math.max(nextLevelRequiredTp - currentLevelRequiredTp, 1);
  const pointsInCurrentLevel = Math.max(0, normalizedTp - currentLevelRequiredTp);
  const pointsToNextLevel = Math.max(0, nextLevelRequiredTp - normalizedTp);
  const progressToNextLevel = Math.min(1, Math.max(0, pointsInCurrentLevel / levelSpan));

  return {
    currentLevel,
    currentLevelRequiredTp,
    nextLevel,
    nextLevelRequiredTp,
    pointsInCurrentLevel,
    pointsToNextLevel,
    progressToNextLevel,
    totalTp: normalizedTp,
  };
}

export function formatTocaPoints(points: number) {
  return `${normalizeTp(points).toLocaleString()} TP`;
}

function normalizeTp(points: number) {
  if (!Number.isFinite(points)) {
    return 0;
  }

  return Math.max(0, Math.floor(points));
}
