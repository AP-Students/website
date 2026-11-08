"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { achievementStatsFrom } from "@/lib/achievements/checkAchievements";
import { useLiveStats } from "@/components/hooks/useLiveStats";

/**
 * Progress comes from the shared live stats listener, so the only listener
 * opened here is the earned list. Both are undefined until loaded, so the
 * card never shows a made-up 0.
 */
export function useAchievements(uid: string | undefined) {
  const { stats: liveStats, error: statsError } = useLiveStats(uid);
  const [earnedIds, setEarnedIds] = useState<ReadonlySet<string>>();
  const [earnedError, setEarnedError] = useState(false);
  useEffect(() => {
    setEarnedIds(undefined);
    setEarnedError(false);
    if (!uid) return;
    return onSnapshot(
      collection(db, `users/${uid}/achievements`),
      (snapshot) => setEarnedIds(new Set(snapshot.docs.map((item) => item.id))),
      (loadError) => {
        console.error("Unable to load achievements", loadError);
        setEarnedError(true);
      },
    );
  }, [uid]);
  return {
    stats: liveStats ? achievementStatsFrom(liveStats) : undefined,
    earnedIds,
    error: earnedError || Boolean(statsError),
  };
}
