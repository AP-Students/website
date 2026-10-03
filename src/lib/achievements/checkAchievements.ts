import {
  ACHIEVEMENTS,
  type AchievementDefinition,
  type AchievementStats,
} from "./definitions.ts";

/** Missing statistics are zero until the corresponding activity is recorded. */
export function readAchievementStats(
  data: Record<string, unknown> | undefined,
): AchievementStats {
  const stats: AchievementStats = {
    readingsCompleted: 0,
    mcqTestsCompleted: 0,
    frqsSubmitted: 0,
    problemsSolved: 0,
    subjectsCompleted: 0,
    longestStreak: 0,
    level: 1,
  };
  for (const key of Object.keys(stats) as (keyof AchievementStats)[]) {
    const value = data?.[key];
    if (typeof value === "number" && Number.isFinite(value) && value >= 0)
      stats[key] = value;
  }
  return stats;
}

export function checkAchievements(
  stats: AchievementStats,
  alreadyEarned: ReadonlySet<string>,
  definitions: readonly AchievementDefinition[] = ACHIEVEMENTS,
): AchievementDefinition[] {
  return definitions.filter(
    (achievement) =>
      !alreadyEarned.has(achievement.id) &&
      stats[achievement.stat] >= achievement.threshold,
  );
}
