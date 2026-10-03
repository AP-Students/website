import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getDeviceTimeZone } from "@/lib/gamification/calendarDay";
import { readStudentStats, type StudentStats } from "@/lib/gamification/stats";
import { dashboardDocumentPaths } from "@/types/dashboard";

export interface LiveStatsState {
  /** Undefined while loading, and after a read error. */
  stats?: StudentStats;
  /**
   * Set when the stats couldn't be read. Kept separate so a failure is never
   * shown as a real "Level 1, 0 XP".
   */
  error?: Error;
}

/**
 * The signed-in student's stats, kept live as the server records activity.
 * Anything that shows or uses a student's XP, level, streak or counts reads
 * them through this hook rather than opening its own listener.
 *
 * Nothing is cached. Every value is one the server has confirmed: a snapshot
 * Firestore answers from its local cache is skipped, because offline, or
 * before the first reply, a document it hasn't fetched yet reads as missing,
 * which looks exactly like a brand-new student with no XP.
 */
export function useLiveStats(uid: string | undefined): LiveStatsState {
  const [state, setState] = useState<LiveStatsState>({});

  useEffect(() => {
    setState({});
    if (!uid) return;

    return onSnapshot(
      doc(db, dashboardDocumentPaths.stats(uid)),
      // Without this, the server confirming what the cache already said is
      // not delivered, since the data didn't change, and the hook would wait.
      { includeMetadataChanges: true },
      (snapshot) => {
        if (snapshot.metadata.fromCache) return;
        setState({
          stats: readStudentStats(snapshot.data(), getDeviceTimeZone()),
        });
      },
      (error) => {
        console.error("Error loading stats:", error);
        setState({ error });
      },
    );
  }, [uid]);

  return state;
}
