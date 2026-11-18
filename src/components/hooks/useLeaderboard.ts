import { useCallback, useEffect, useRef, useState } from "react";
import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  LEADERBOARD_REFRESH_MS,
  LEADERBOARD_SIZE,
  rankEntries,
  rankFromCountAbove,
  toLeaderboardEntry,
  type LeaderboardEntry,
} from "@/lib/leaderboard";

export interface LeaderboardState {
  entries?: LeaderboardEntry[];
  /** Where the viewer is, or would be if their profile were public. */
  myRank?: number;
  isPublic?: boolean;
  updatedAt?: Date;
  error?: Error;
  loading: boolean;
  refresh: () => void;
}

// Only public profiles can be read by others, so every query filters on
// isPublic. Needs the (isPublic, xp desc) index in firestore.indexes.json.
const publicByXp = () =>
  query(
    collection(db, "profiles"),
    where("isPublic", "==", true),
    orderBy("xp", "desc"),
  );

export function useLeaderboard(
  uid: string | undefined,
  xp: number | undefined,
): LeaderboardState {
  const [state, setState] = useState<Omit<LeaderboardState, "refresh">>({
    loading: true,
  });
  // Drops answers from an older load that finish after a newer one.
  const latest = useRef(0);

  const load = useCallback(async () => {
    if (!uid || xp === undefined) return;
    const id = ++latest.current;
    setState((current) => ({ ...current, loading: true }));
    try {
      const [top, mine, above] = await Promise.all([
        getDocs(query(publicByXp(), limit(LEADERBOARD_SIZE))),
        getDoc(doc(db, "profiles", uid)),
        getCountFromServer(query(publicByXp(), where("xp", ">", xp))),
      ]);
      if (id !== latest.current) return;
      setState({
        entries: rankEntries(
          top.docs.map((profile) =>
            toLeaderboardEntry(profile.id, profile.data()),
          ),
        ),
        myRank: rankFromCountAbove(above.data().count),
        isPublic: mine.data()?.isPublic === true,
        updatedAt: new Date(),
        loading: false,
      });
    } catch (error) {
      if (id !== latest.current) return;
      console.error("Error loading the leaderboard:", error);
      setState((current) => ({
        ...current,
        error: error instanceof Error ? error : new Error(String(error)),
        loading: false,
      }));
    }
  }, [uid, xp]);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), LEADERBOARD_REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  return { ...state, refresh: () => void load() };
}
