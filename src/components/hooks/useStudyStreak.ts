import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  getDeviceTimeZone,
  isValidTimeZone,
} from "@/lib/gamification/calendarDay";
import { readStreakState, type StreakState } from "@/lib/gamification/streak";
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
 * The signed-in student's streak and activity calendar, kept live as the
 * server records new activity.
 */
export function useStudyStreak(uid: string | undefined): StudyStreakState {
  const [stats, setStats] = useState<Omit<StudyStreak, "calendarDays">>();
  const [calendars, setCalendars] = useState<
    Record<number, Record<string, number>>
  >({});
  const [error, setError] = useState<Error>();

  useEffect(() => {
    setStats(undefined);
    setError(undefined);
    if (!uid) return;

    return onSnapshot(
      doc(db, dashboardDocumentPaths.stats(uid)),
      (snapshot) => {
        const data = snapshot.data();
        const timeZone: unknown = data?.timeZone;
        setStats({
          streak: readStreakState(data),
          // No zone on file means nothing recorded yet, so any zone will do.
          timeZone:
            typeof timeZone === "string" && isValidTimeZone(timeZone)
              ? timeZone
              : getDeviceTimeZone(),
        });
      },
      (streakError) => {
        console.error("Error loading streak:", streakError);
        setError(streakError);
      },
    );
  }, [uid]);

  useEffect(() => {
    setCalendars({});
    if (!uid) return;

    // Calendar documents are per year, and the month view can step back
    // from January into last December.
    const thisYear = new Date().getFullYear();
    const unsubscribes = [thisYear - 1, thisYear].map((year) =>
      onSnapshot(
        doc(db, dashboardDocumentPaths.calendar(uid, year)),
        (snapshot) => {
          const days = (snapshot.data()?.days ?? {}) as Record<string, number>;
          setCalendars((previous) => ({ ...previous, [year]: days }));
        },
        (calendarError) => {
          console.error(`Error loading ${year} activity:`, calendarError);
          setError(calendarError);
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

  if (error) return { error };
  return { studyStreak: stats && { ...stats, calendarDays } };
}
