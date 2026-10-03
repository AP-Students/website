"use client";

import { useEffect, useState } from "react";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { dashboardDocumentPaths } from "@/types/dashboard";
import { readAchievementStats } from "@/lib/achievements/checkAchievements";

export function useAchievements(uid: string | undefined) {
  const [stats, setStats] = useState(() => readAchievementStats(undefined));
  const [earnedIds, setEarnedIds] = useState<ReadonlySet<string>>(new Set());
  const [error, setError] = useState(false);
  useEffect(() => {
    setStats(readAchievementStats(undefined));
    setEarnedIds(new Set());
    setError(false);
    if (!uid) return;
    const onError = (loadError: Error) => {
      console.error("Unable to load achievements", loadError);
      setError(true);
    };
    const unsubscribeStats = onSnapshot(
      doc(db, dashboardDocumentPaths.stats(uid)),
      (snapshot) => setStats(readAchievementStats(snapshot.data())),
      onError,
    );
    const unsubscribeEarned = onSnapshot(
      collection(db, `users/${uid}/achievements`),
      (snapshot) => setEarnedIds(new Set(snapshot.docs.map((item) => item.id))),
      onError,
    );
    return () => {
      unsubscribeStats();
      unsubscribeEarned();
    };
  }, [uid]);
  return { stats, earnedIds, error };
}
