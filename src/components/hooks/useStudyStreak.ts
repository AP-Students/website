import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  getDeviceTimeZone,
  isValidTimeZone,
} from "@/lib/gamification/calendarDay";
import {
  NO_STREAK,
  readStreakState,
  type StreakState,
} from "@/lib/gamification/streak";

export interface StudyStreak {
  streak: StreakState;
  /** The zone the streak's days are counted in. */
  timeZone: string;
  /** Completions per day, e.g. "2026-09-20" -> 3, for this year and last. */
  calendarDays: Record<string, number>;
}

/**
 * The signed-in student's streak and activity calendar, kept live as the
 * server records new activity. Undefined until the streak has loaded.
 */
export function useStudyStreak(
  uid: string | undefined,
): StudyStreak | undefined {
  const [stats, setStats] = useState<Omit<StudyStreak, "calendarDays">>();
  const [calendars, setCalendars] = useState<
    Record<number, Record<string, number>>
  >({});

  useEffect(() => {
    setStats(undefined);
    if (!uid) return;

    return onSnapshot(
      doc(db, "userStats", uid),
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
      (error) => {
        console.error("Error loading streak:", error);
        setStats({ streak: NO_STREAK, timeZone: getDeviceTimeZone() });
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
        doc(db, "activityCalendar", `${uid}_${year}`),
        (snapshot) => {
          const days = (snapshot.data()?.days ?? {}) as Record<string, number>;
          setCalendars((previous) => ({ ...previous, [year]: days }));
        },
        (error) => console.error(`Error loading ${year} activity:`, error),
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

  return stats && { ...stats, calendarDays };
}
