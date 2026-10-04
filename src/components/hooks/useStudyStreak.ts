import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLiveStats } from "@/components/hooks/useLiveStats";
import type { StreakState } from "@/lib/gamification/streak";
import { dashboardDocumentPaths } from "@/types/dashboard";

export interface StudyStreak {
  streak: StreakState;
  /** The zone the streak's days are counted in. */
  timeZone: string;
  /** Completions per day, e.g. "2026-09-20" -> 3, for this year and last. */
  calendarDays: Record<string, number>;
}

export interface StudyStreakState {
  /** Undefined while loading, and after a read error. */
  studyStreak?: StudyStreak;
  /**
   * Set when the streak or calendar couldn't be read. Kept separate so a
   * failure is never shown as a real streak of 0 with no activity.
   */
  error?: Error;
}

/**
 * Calendar documents are per year. Last year's is loaded too, so the month
 * view can step back from January into December and the year view can show
 * the year before.
 */
function calendarYears(): number[] {
  const thisYear = new Date().getFullYear();
  return [thisYear - 1, thisYear];
}

/**
 * The signed-in student's streak and activity calendar, kept live as the
 * server records new activity.
 */
export function useStudyStreak(uid: string | undefined): StudyStreakState {
  const { stats, error: statsError } = useLiveStats(uid);
  const [calendars, setCalendars] = useState<
    Record<number, Record<string, number>>
  >({});
  const [calendarError, setCalendarError] = useState<Error>();

  useEffect(() => {
    setCalendars({});
    setCalendarError(undefined);
    if (!uid) return;

    const unsubscribes = calendarYears().map((year) =>
      onSnapshot(
        doc(db, dashboardDocumentPaths.calendar(uid, year)),
        (snapshot) => {
          const days = (snapshot.data()?.days ?? {}) as Record<string, number>;
          setCalendars((previous) => ({ ...previous, [year]: days }));
        },
        (error) => {
          console.error(`Error loading ${year} activity:`, error);
          setCalendarError(error);
        },
      ),
    );
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [uid]);

  const calendarDays = useMemo(
    () =>
      Object.values(calendars).reduce<Record<string, number>>(
        (all, days) => Object.assign(all, days),
        {},
      ),
    [calendars],
  );

  const error = statsError ?? calendarError;
  if (error) return { error };
  // Wait for both years, or a calendar would show as empty until they arrive.
  const calendarsLoaded = calendarYears().every((year) => year in calendars);
  if (!stats || !calendarsLoaded) return {};
  return {
    studyStreak: {
      streak: stats.streak,
      timeZone: stats.timeZone,
      calendarDays,
    },
  };
}
