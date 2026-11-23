import { isValidTimeZone } from "./calendarDay.ts";
import { readStreakState, type StreakState } from "./streak.ts";
import { readXpProgress, type XpProgress } from "./xp.ts";

/**
 * A student's stats as the site reads them.
 *
 * `userStats/{uid}` is written only by the /api/activity routes, but a given
 * document can still be missing fields (a student who has only read chapters
 * has no streak yet) or hold values from before a field was tracked. This
 * reads whatever is stored the same way every time, so every page that shows
 * a stat, and everything Ask or Oogway is told about a student, agrees.
 */

export interface SubjectStats {
  attempted: number;
  correct: number;
  readingsCompleted: number;
  totalReadings: number;
}

export interface StudentStats {
  /** Level and progress, always worked out from the XP total. */
  xp: XpProgress;
  /**
   * The streak as of the last activity. Use `streakAsOf` for the streak
   * today: one whose last day is before yesterday has lapsed to 0.
   */
  streak: StreakState;
  /** The zone the student's days are counted in. */
  timeZone: string;
  readingsCompleted: number;
  mcqTestsCompleted: number;
  problemsSolved: number;
  frqsSubmitted: number;
  subjectsCompleted: number;
  /** Keyed by subject slug, e.g. "ap-physics-2". */
  perSubject: Record<string, SubjectStats>;
}

const toCount = (value: unknown) =>
  typeof value === "number" && Number.isInteger(value) && value > 0 ? value : 0;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function readSubjectStats(data: Record<string, unknown>): SubjectStats {
  return {
    attempted: toCount(data.attempted),
    correct: toCount(data.correct),
    readingsCompleted: toCount(data.readingsCompleted),
    totalReadings: toCount(data.totalReadings),
  };
}

/**
 * The stats in a `userStats` document, with anything unusable read as 0. No
 * document at all is a student who hasn't done anything yet. `fallbackTimeZone`
 * is used when no zone is on file, which also means nothing has been recorded,
 * so any zone will do.
 */
export function readStudentStats(
  data: Record<string, unknown> | undefined,
  fallbackTimeZone: string,
): StudentStats {
  const timeZone = data?.timeZone;
  const perSubject = isRecord(data?.perSubject) ? data.perSubject : {};

  return {
    xp: readXpProgress(data),
    streak: readStreakState(data),
    timeZone:
      typeof timeZone === "string" && isValidTimeZone(timeZone)
        ? timeZone
        : fallbackTimeZone,
    readingsCompleted: toCount(data?.readingsCompleted),
    mcqTestsCompleted: toCount(data?.mcqTestsCompleted),
    problemsSolved: toCount(data?.problemsSolved),
    frqsSubmitted: toCount(data?.frqsSubmitted),
    subjectsCompleted: toCount(data?.subjectsCompleted),
    perSubject: Object.fromEntries(
      Object.entries(perSubject).flatMap(([slug, subject]) =>
        isRecord(subject) ? [[slug, readSubjectStats(subject)]] : [],
      ),
    ),
  };
}
