/**
 * Calendar days in the student's own time zone.
 *
 * Streaks and the activity calendar both count days, and a "day" has to mean
 * the student's day: an FRQ finished at 11pm in California is Tuesday's work
 * even though it is already Wednesday in UTC. So every timestamp is converted
 * to a `DayKey` ("YYYY-MM-DD") in the student's time zone exactly once, and
 * from then on only calendar dates are compared or stepped.
 *
 * Daylight-saving time is why the stepping never touches instants. The day
 * clocks spring forward is 23 hours long and the day they fall back is 25, so
 * "add 24 hours" can land on the same day twice or skip one entirely. Stepping
 * a date on the calendar (the 8th becomes the 9th) has no such edge.
 */

/** A calendar date, formatted "YYYY-MM-DD", with no time or zone attached. */
export type DayKey = string;

export const FALLBACK_TIME_ZONE = "UTC";

const DAY_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

// Building an Intl formatter is expensive relative to using one, and a year of
// activity converts thousands of timestamps through the same zone.
const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      calendar: "gregory",
      numberingSystem: "latn",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    formatterCache.set(timeZone, formatter);
  }
  return formatter;
}

/** Whether the runtime recognises `timeZone` as an IANA zone name. */
export function isValidTimeZone(timeZone: string | null | undefined): boolean {
  if (!timeZone) return false;
  try {
    getFormatter(timeZone);
    return true;
  } catch {
    return false;
  }
}

/**
 * The zone to count days in: the one given if it is real, otherwise UTC, so a
 * missing or mistyped setting shifts day boundaries rather than crashing.
 */
export function resolveTimeZone(timeZone: string | null | undefined): string {
  return timeZone && isValidTimeZone(timeZone) ? timeZone : FALLBACK_TIME_ZONE;
}

/** The zone the browser (or Node process) is running in, if it reports one. */
export function getDeviceTimeZone(): string {
  return resolveTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
}

/** The calendar day `instant` falls on for someone living in `timeZone`. */
export function toDayKey(instant: Date, timeZone: string): DayKey {
  if (Number.isNaN(instant.getTime())) {
    throw new RangeError("Cannot take the calendar day of an invalid date");
  }

  const parts = getFormatter(resolveTimeZone(timeZone)).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return `${part("year").padStart(4, "0")}-${part("month")}-${part("day")}`;
}

/** Today's calendar day in `timeZone`. */
export function todayDayKey(timeZone: string, now: Date = new Date()): DayKey {
  return toDayKey(now, timeZone);
}

function parseDayKey(key: DayKey): {
  year: number;
  month: number;
  day: number;
} {
  const match = DAY_KEY_PATTERN.exec(key);
  if (!match) throw new RangeError(`Not a calendar day: "${key}"`);

  const [, year, month, day] = match.map(Number) as [
    number,
    number,
    number,
    number,
  ];
  // Round-tripping through a UTC date rejects impossible days like 02-30.
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) {
    throw new RangeError(`Not a calendar day: "${key}"`);
  }
  return { year, month, day };
}

// UTC has no daylight saving, so it is a safe scratchpad for pure calendar
// arithmetic: midnight UTC on a date plus N whole days is always that date + N.
function dayKeyToUtcMs(key: DayKey): number {
  const { year, month, day } = parseDayKey(key);
  return Date.UTC(year, month - 1, day);
}

function utcMsToDayKey(ms: number): DayKey {
  return new Date(ms).toISOString().slice(0, 10);
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** The calendar day `days` after `key` (negative steps backwards). */
export function addDays(key: DayKey, days: number): DayKey {
  return utcMsToDayKey(dayKeyToUtcMs(key) + days * MS_PER_DAY);
}

/** Whole calendar days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(from: DayKey, to: DayKey): number {
  return Math.round((dayKeyToUtcMs(to) - dayKeyToUtcMs(from)) / MS_PER_DAY);
}

/** Day of the week for a calendar day, 0 = Sunday through 6 = Saturday. */
export function dayOfWeek(key: DayKey): number {
  return new Date(dayKeyToUtcMs(key)).getUTCDay();
}

/** Every calendar day from `from` through `to`, inclusive, in order. */
export function eachDay(from: DayKey, to: DayKey): DayKey[] {
  const length = daysBetween(from, to) + 1;
  return Array.from({ length: Math.max(length, 0) }, (_, i) =>
    addDays(from, i),
  );
}
