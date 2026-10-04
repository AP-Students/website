import { useCallback, useSyncExternalStore } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getDeviceTimeZone } from "@/lib/gamification/calendarDay";
import {
  createLiveStatsStore,
  LOADING,
  type LiveStatsState,
} from "@/lib/gamification/liveStatsStore";
import { dashboardDocumentPaths } from "@/types/dashboard";

export type { LiveStatsState };

const store = createLiveStatsStore(
  (uid, onStats, onError) =>
    onSnapshot(
      doc(db, dashboardDocumentPaths.stats(uid)),
      // Without this, the server confirming what the cache already said is
      // not delivered, since the data didn't change, and readers would wait.
      // It also delivers the cached snapshot Firestore raises when the
      // connection drops, which is what sends readers back to loading.
      { includeMetadataChanges: true },
      (snapshot) =>
        onStats({
          fromCache: snapshot.metadata.fromCache,
          data: snapshot.data(),
        }),
      (error) => {
        console.error("Error loading stats:", error);
        onError(error);
      },
    ),
  getDeviceTimeZone,
);

/**
 * The signed-in student's stats, kept live as the server records activity.
 * Anything that shows or uses a student's XP, level, streak or counts reads
 * them through this hook rather than opening its own listener.
 *
 * Every component that calls it for the same student shares one Firestore
 * listener, which closes when the last of them unmounts.
 *
 * Nothing is cached. Only stats the server has confirmed are returned: before
 * its first reply, and whenever the connection drops, this is loading.
 */
export function useLiveStats(uid: string | undefined): LiveStatsState {
  const subscribe = useCallback(
    (onChange: () => void) =>
      uid ? store.subscribe(uid, onChange) : () => undefined,
    [uid],
  );
  return useSyncExternalStore(
    subscribe,
    () => (uid ? store.getState(uid) : LOADING),
    () => LOADING,
  );
}
