import { levelForXp } from "./gamification/xp.ts";

export const LEADERBOARD_SIZE = 20;
export const LEADERBOARD_REFRESH_MS = 5 * 60 * 1000;

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL?: string;
  level: number;
  xp: number;
  rank: number;
}

const wholeNumber = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 0;

// Turns a public profile doc into a row. The level is worked out from the XP
// so the two can't disagree.
export function toLeaderboardEntry(
  uid: string,
  data: Record<string, unknown> | undefined,
): Omit<LeaderboardEntry, "rank"> {
  const xp = wholeNumber(data?.xp);
  const name =
    typeof data?.displayName === "string" ? data.displayName.trim() : "";
  const photoURL =
    typeof data?.photoURL === "string" && data.photoURL.startsWith("https://")
      ? data.photoURL
      : undefined;
  return {
    uid,
    displayName: name || "Student",
    ...(photoURL ? { photoURL } : {}),
    level: levelForXp(xp).level,
    xp,
  };
}

// Expects entries sorted by XP, highest first. Ties share a rank: 1, 2, 2, 4.
export function rankEntries(
  entries: readonly Omit<LeaderboardEntry, "rank">[],
): LeaderboardEntry[] {
  let rank = 0;
  return entries.map((entry, index) => {
    if (index === 0 || entry.xp !== entries[index - 1]!.xp) rank = index + 1;
    return { ...entry, rank };
  });
}

// Your rank is one more than the number of public profiles with more XP than
// you, so it matches rankEntries when you're on the board.
export function rankFromCountAbove(countAbove: number): number {
  return wholeNumber(countAbove) + 1;
}
