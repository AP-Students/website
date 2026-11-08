import {
  addDays,
  dayOfWeek,
  daysBetween,
  formatDayKey,
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
 * does scale to the student, so its ramp always uses all four shades, but it
 * caps the scale at the 90th percentile of their active days rather than
 * their single busiest day: see `cappedThresholds`.
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

/**
 * Thresholds that scale to a student's own activity without letting one huge
 * day set the scale. The darkest shade starts at the given percentile of the
 * days they were active (nearest rank), so by default their busiest tenth of
 * days share it and everything below spreads over the lighter shades.
 * Scaling to the single busiest day instead would leave a student with one
 * 40-activity day and a year of 3s looking almost empty.
 */
export function cappedThresholds(
  counts: Iterable<number>,
  percentile = 0.9,
): IntensityThresholds {
  const active = [...counts]
    .filter((count) => Number.isFinite(count) && count > 0)
    .sort((a, b) => a - b);
  if (active.length === 0) return DEFAULT_INTENSITY_THRESHOLDS;
  const rank = Math.max(1, Math.ceil(percentile * active.length));
  return thresholdsForMax(active[rank - 1] ?? 1);
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

const yearPrefix = (year: number) => `${String(year).padStart(4, "0")}-`;

/**
 * How many week columns a calendar year spans, from the week holding Jan 1
 * to the week holding Dec 31. Usually 53, but a leap year that starts on the
 * last day of the week (Saturday, for Sunday-first weeks, as in 2028) needs
 * 54: its first and last days each sit alone in a column.
 */
export function weeksInYear(year: number, weekStartsOn: 0 | 1 = 0): number {
  const first = `${yearPrefix(year)}01-01`;
  const last = `${yearPrefix(year)}12-31`;
  const leadingDays = (dayOfWeek(first) - weekStartsOn + 7) % 7;
  return Math.ceil((leadingDays + daysBetween(first, last) + 1) / 7);
}

export type YearCalendarDay = CalendarCell & {
  /** After today: drawn, so the year keeps its shape, but empty. */
  isFuture: boolean;
};

/** The weeks a month's label sits over, counted from the first column. */
export type MonthSpan = { month: number; firstWeek: number; weeks: number };

export type YearCalendar = {
  year: number;
  /** One column per week, first day of the week on top; null outside the year. */
  weeks: (YearCalendarDay | null)[][];
  /** Each month, over the columns whose first day in the year falls in it. */
  months: MonthSpan[];
  /** Every activity in the year so far. */
  total: number;
  /** Jan 1. */
  firstDay: DayKey;
  /** Today in the current year, Dec 31 in a past one; null in a future one. */
  lastDay: DayKey | null;
};

export type BuildYearCalendarOptions = {
  /** Today in the student's time zone. */
  today: DayKey;
  /** 0 = weeks start on Sunday (GitHub's layout), 1 = Monday. */
  weekStartsOn?: 0 | 1;
  /** Where the darkest shade starts; see `cappedThresholds`. */
  percentile?: number;
};

/**
 * A whole calendar year laid out GitHub-style, with each day's shade scaled
 * to the student's activity that year.
 */
export function buildYearCalendar(
  counts: ReadonlyMap<DayKey, number>,
  year: number,
  { today, weekStartsOn = 0, percentile = 0.9 }: BuildYearCalendarOptions,
): YearCalendar {
  const prefix = yearPrefix(year);
  const firstDay = `${prefix}01-01`;
  const dec31 = `${prefix}12-31`;
  const lastDay =
    daysBetween(firstDay, today) < 0
      ? null
      : daysBetween(today, dec31) < 0
        ? dec31
        : today;

  const yearCounts = [...counts].filter(
    ([day]) =>
      day.startsWith(prefix) &&
      lastDay !== null &&
      daysBetween(day, lastDay) >= 0,
  );
  const countFor = new Map(yearCounts);
  const thresholds = cappedThresholds(
    yearCounts.map(([, count]) => count),
    percentile,
  );

  const leadingDays = (dayOfWeek(firstDay) - weekStartsOn + 7) % 7;
  const start = addDays(firstDay, -leadingDays);
  const weeks = Array.from(
    { length: weeksInYear(year, weekStartsOn) },
    (_, w) =>
      Array.from({ length: 7 }, (_, d): YearCalendarDay | null => {
        const day = addDays(start, w * 7 + d);
        if (!day.startsWith(prefix)) return null;
        const count = countFor.get(day) ?? 0;
        return {
          day,
          count,
          level: intensityLevel(count, thresholds),
          isFuture: lastDay === null || daysBetween(day, lastDay) < 0,
        };
      }),
  );

  const months: MonthSpan[] = [];
  weeks.forEach((week, w) => {
    const firstInYear = week.find((cell) => cell !== null);
    const month = Number(firstInYear?.day.slice(5, 7)) - 1;
    const current = months[months.length - 1];
    if (current?.month === month) current.weeks += 1;
    else months.push({ month, firstWeek: w, weeks: 1 });
  });

  return {
    year,
    weeks,
    months,
    total: yearCounts.reduce((sum, [, count]) => sum + count, 0),
    firstDay,
    lastDay,
  };
}

/** "3 activities", "1 activity" or "No activity". */
export function describeActivity(count: number): string {
  if (count <= 0) return "No activity";
  return `${count} ${count === 1 ? "activity" : "activities"}`;
}

/** What hovering or tapping a day shows: "3 activities on Sep 20." */
export function daySummary(day: DayKey, count: number): string {
  return `${describeActivity(count)} on ${formatDayKey(day, { month: "short", day: "numeric" })}.`;
}

/**
 * The same day for a screen reader, which hears it without the grid around
 * it: "3 activities on Sunday, September 20, 2026".
 */
export function dayLabel(day: DayKey, count: number): string {
  return `${describeActivity(count)} on ${formatDayKey(day, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })}`;
}
