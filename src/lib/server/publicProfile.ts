import { readStreakState, resolveActivityDay, streakAsOf } from "../gamification/streak.ts";
import { levelForXp, readXpTotal } from "../gamification/xp.ts";
import type { PublicProfile } from "../../types/dashboard.ts";

const nonNegativeCount = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : 0;

const safePhotoURL = (value: unknown): string | undefined => {
  if (typeof value !== "string" || value.length > 2048) return undefined;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      !["firebasestorage.googleapis.com", "lh3.googleusercontent.com"].includes(url.hostname) ||
      url.username ||
      url.password
    ) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
};

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
  const photoURL = safePhotoURL(user?.photoURL);
  const displayName =
    typeof user?.displayName === "string"
      ? user.displayName.trim().slice(0, 80)
      : "";
  const today = resolveActivityDay(
    new Date(),
    stats?.timeZone,
    stats?.timeZone,
  ).day;

  return {
    uid,
    isPublic,
    displayName: displayName || "Student",
    ...(typeof photoURL === "string" && photoURL
      ? { photoURL }
      : {}),
    xp,
    level: levelForXp(xp).level,
    currentStreak: streakAsOf(streak, today),
    longestStreak: streak.longestStreak,
    problemsSolved: nonNegativeCount(stats?.problemsSolved),
    subjectsCompleted: nonNegativeCount(stats?.subjectsCompleted),
    achievementCount: nonNegativeCount(achievements.length),
    achievements: achievements.map(({ id, title }) => ({ id, title })),
  };
}
