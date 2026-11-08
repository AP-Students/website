import {
  FALLBACK_TIME_ZONE,
  daysBetween,
  isDayKey,
  isValidTimeZone,
  toDayKey,
  type DayKey,
} from "./calendarDay.ts";

/**
 * Daily study streaks.
 *
 * A student keeps a streak by finishing at least one FRQ or MCQ test every
 * calendar day, counted in their own time zone. Reading a chapter is progress
 * too, but it doesn't count toward a streak. The streak lives on
 * `userStats/{uid}` and only server code advances it, when an activity is
 * recorded. Nothing runs at midnight to reset it: a streak whose last active
 * day is before yesterday reads as 0, and the next activity starts a new one.
 */

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastActiveDay: DayKey | null;
}

export const NO_STREAK: StreakState = {
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDay: null,
};

/**
 * The streak after studying on `day`.
 *
 * The first activity of a day extends a streak that was alive yesterday and
 * starts a new one otherwise; more activity the same day changes nothing. A
 * day before the last active one (a late retry, or a time zone change) is
 * already covered, so it is ignored rather than rewinding the streak.
 */
export function recordActiveDay(streak: StreakState, day: DayKey): StreakState {
  const gap =
    streak.lastActiveDay === null
      ? null
      : daysBetween(streak.lastActiveDay, day);
  if (gap !== null && gap <= 0) return streak;

  const currentStreak = gap === 1 ? streak.currentStreak + 1 : 1;
  return {
    currentStreak,
    longestStreak: Math.max(streak.longestStreak, currentStreak),
    lastActiveDay: day,
  };
}

/**
 * The streak as it stands on `today`. Studying yesterday still counts because
 * today isn't over yet; once a whole day has gone by with nothing, it's 0.
 */
export function streakAsOf(streak: StreakState, today: DayKey): number {
  if (streak.lastActiveDay === null) return 0;
  return daysBetween(streak.lastActiveDay, today) <= 1
    ? streak.currentStreak
    : 0;
}

/**
 * The day a new activity counts toward, and the zone to remember for next time.
 *
 * The browser reports its zone with each activity so that days follow a
 * student who travels. A reported zone is only a claim, though, and claiming
 * one further west would turn just-after-midnight back into yesterday and
 * patch a missed day. So once a zone is on file, the day is the later of today
 * there and today in the reported zone. A move east takes effect at once; a
 * move west only from the next activity, by which point it is just the zone
 * the student lives in.
 */
export function resolveActivityDay(
  now: Date,
  storedTimeZone: unknown,
  reportedTimeZone: unknown,
): { day: DayKey; timeZone: string } {
  const stored =
    typeof storedTimeZone === "string" && isValidTimeZone(storedTimeZone)
      ? storedTimeZone
      : null;
  const reported =
    typeof reportedTimeZone === "string" && isValidTimeZone(reportedTimeZone)
      ? reportedTimeZone
      : null;

  const timeZone = reported ?? stored ?? FALLBACK_TIME_ZONE;
  const day = toDayKey(now, timeZone);
  if (stored === null || stored === timeZone) return { day, timeZone };

  const storedDay = toDayKey(now, stored);
  return { day: daysBetween(day, storedDay) > 0 ? storedDay : day, timeZone };
}

const toCount = (value: unknown) =>
  typeof value === "number" && Number.isInteger(value) && value > 0 ? value : 0;

/** The streak fields of a `userStats` document, with bad values zeroed. */
export function readStreakState(
  data: Record<string, unknown> | undefined,
): StreakState {
  const currentStreak = toCount(data?.currentStreak);
  const lastActiveDay = data?.lastActiveDay;
  return {
    currentStreak,
    longestStreak: Math.max(toCount(data?.longestStreak), currentStreak),
    lastActiveDay: isDayKey(lastActiveDay) ? lastActiveDay : null,
  };
}
