import { readStreakState } from "../gamification/streak.ts";
import { levelForXp, readXpTotal } from "../gamification/xp.ts";
import type { PublicProfile } from "../../types/dashboard.ts";

const nonNegativeCount = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : 0;

/** Build the allowlisted public projection; private fields never get spread. */
export function buildPublicProfile(
  uid: string,
  user: Record<string, unknown> | undefined,
  stats: Record<string, unknown> | undefined,
  achievements: Array<{ id: string; title: string }>,
  isPublic: boolean,
): PublicProfile {
  const xp = readXpTotal(stats);
  const streak = readStreakState(stats);
  const photoURL = user?.photoURL;

  return {
    uid,
    isPublic,
    displayName:
      typeof user?.displayName === "string" ? user.displayName : "Student",
    ...(typeof photoURL === "string" && photoURL
      ? { photoURL }
      : {}),
    xp,
    level: levelForXp(xp).level,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    problemsSolved: nonNegativeCount(stats?.problemsSolved),
    subjectsCompleted: nonNegativeCount(stats?.subjectsCompleted),
    achievementCount: nonNegativeCount(achievements.length),
    achievements: achievements.map(({ id, title }) => ({ id, title })),
  };
}
