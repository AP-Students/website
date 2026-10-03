import {
  addDays,
  dayOfWeek,
  daysBetween,
  toDayKey,
  type DayKey,
} from "./calendarDay.ts";

/**
 * The shape of the activity calendar: which calendar days a student was
 * active on, and how dark each day's square should be.
 *
 * Intensity uses fixed thresholds by default rather than scaling to the
 * student's own busiest day (as GitHub does). Scaling makes a student's first
 * ever question paint a full-intensity square, and quietly fades every old
 * day the first time they have a big one. The year calendar on the dashboard
 * scales anyway, by design, so its ramp always uses all four shades;
 * `thresholdsForMax` builds those thresholds from the year's busiest day.
 */

/** 0 = no activity, 4 = the most. */
export type IntensityLevel = 0 | 1 | 2 | 3 | 4;

/**
 * The fewest completions a day needs to reach levels 1 through 4. Level 1
 * must start at 1 so that any activity at all shows up on the calendar.
 */
export type IntensityThresholds = readonly [number, number, number, number];

export const DEFAULT_INTENSITY_THRESHOLDS: IntensityThresholds = [1, 3, 6, 10];

export function intensityLevel(
  count: number,
  thresholds: IntensityThresholds = DEFAULT_INTENSITY_THRESHOLDS,
): IntensityLevel {
  let level: IntensityLevel = 0;
  thresholds.forEach((minimum, i) => {
    if (count >= minimum) level = (i + 1) as IntensityLevel;
  });
  return level;
}

/**
 * Thresholds that scale to the busiest day in view: that day is always level
 * 4, one completion is always at least level 1, and the levels between split
 * the range evenly. When a new busiest day appears, earlier days shift down a
 * shade. Pass the largest count in the window being drawn.
 */
export function thresholdsForMax(maxInWindow: number): IntensityThresholds {
  const max = Number.isFinite(maxInWindow)
    ? Math.max(1, Math.floor(maxInWindow))
    : 1;
  const minimumFor = (level: number) =>
    1 + Math.ceil(((level - 1) * (max - 1)) / 3);
  return [minimumFor(1), minimumFor(2), minimumFor(3), minimumFor(4)];
}

/** Tallies instants into per-day counts in the student's time zone. */
export function countByDay(
  instants: Iterable<Date>,
  timeZone: string,
): Map<DayKey, number> {
  const counts = new Map<DayKey, number>();
  for (const instant of instants) {
    const key = toDayKey(instant, timeZone);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export type CalendarCell = {
  day: DayKey;
  count: number;
  level: IntensityLevel;
};

/**
 * One column of the calendar, top to bottom from the first day of the week.
 * A slot is null where the day is after `lastDay`, so the final week can be
 * drawn short without shifting the rows out of line.
 */
export type CalendarWeek = (CalendarCell | null)[];

export type BuildCalendarOptions = {
  /** Usually today in the student's time zone. */
  lastDay: DayKey;
  /** How many week columns to show, including the one containing `lastDay`. */
  weeks?: number;
  /** 0 = weeks start on Sunday (GitHub's layout), 1 = Monday. */
  weekStartsOn?: 0 | 1;
  thresholds?: IntensityThresholds;
};

export function buildCalendarWeeks(
  counts: ReadonlyMap<DayKey, number>,
  {
    lastDay,
    weeks = 53,
    weekStartsOn = 0,
    thresholds = DEFAULT_INTENSITY_THRESHOLDS,
  }: BuildCalendarOptions,
): CalendarWeek[] {
  const offsetIntoWeek = (dayOfWeek(lastDay) - weekStartsOn + 7) % 7;
  const firstDay = addDays(lastDay, -offsetIntoWeek - (weeks - 1) * 7);

  return Array.from({ length: weeks }, (_, week) =>
    Array.from({ length: 7 }, (_, weekday) => {
      const day = addDays(firstDay, week * 7 + weekday);
      if (daysBetween(day, lastDay) < 0) return null;
      const count = counts.get(day) ?? 0;
      return { day, count, level: intensityLevel(count, thresholds) };
    }),
  );
}
