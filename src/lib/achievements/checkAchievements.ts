import {
  ACHIEVEMENTS,
  type AchievementDefinition,
  type AchievementStats,
} from "./definitions.ts";

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
