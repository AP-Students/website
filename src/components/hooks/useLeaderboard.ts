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
  friendsBoard,
  LEADERBOARD_REFRESH_MS,
  LEADERBOARD_SIZE,
  rankEntries,
  rankFromCountAbove,
  toLeaderboardEntry,
  type LeaderboardEntry,
} from "@/lib/leaderboard";

export type LeaderboardScope = "everyone" | "friends";

export interface LeaderboardState {
  entries?: LeaderboardEntry[];
  /** Where the viewer is, or would be if their profile were public. */
  myRank?: number;
  isPublic?: boolean;
  /** Friends view only. */
  friendCount?: number;
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

async function loadEveryone(uid: string, xp: number | undefined) {
  const [top, mine, above] = await Promise.all([
    getDocs(query(publicByXp(), limit(LEADERBOARD_SIZE))),
    getDoc(doc(db, "profiles", uid)),
    xp === undefined
      ? undefined
      : getCountFromServer(query(publicByXp(), where("xp", ">", xp))),
  ]);
  return {
    entries: rankEntries(
      top.docs.map((profile) => toLeaderboardEntry(profile.id, profile.data())),
    ),
    myRank: above ? rankFromCountAbove(above.data().count) : undefined,
    isPublic: mine.data()?.isPublic === true,
  };
}

// Friends can read each other's profiles even when they're private, so this
// reads them one by one rather than with a query.
async function loadFriends(
  uid: string,
  xp: number | undefined,
  me: { displayName?: string; photoURL?: string },
) {
  const friendIds = (
    await getDocs(collection(db, "users", uid, "friends"))
  ).docs.map((friend) => friend.id);
  const [mine, ...theirs] = await Promise.all(
    [uid, ...friendIds].map((id) =>
      getDoc(doc(db, "profiles", id)).catch((error) => {
        console.error("Error loading a friend's profile:", error);
        return null;
      }),
    ),
  );
  const entries = friendsBoard(
    toLeaderboardEntry(uid, {
      displayName: me.displayName,
      photoURL: me.photoURL,
      ...mine?.data(),
      // Your live XP if it's loaded, otherwise what your profile last said.
      ...(xp === undefined ? {} : { xp }),
    }),
    theirs.flatMap((profile) =>
      profile?.exists() ? [toLeaderboardEntry(profile.id, profile.data())] : [],
    ),
  );
  return {
    entries,
    myRank: entries.find((entry) => entry.uid === uid)?.rank,
    friendCount: friendIds.length,
  };
}

export function useLeaderboard(
  uid: string | undefined,
  xp: number | undefined,
  scope: LeaderboardScope = "everyone",
  me: { displayName?: string; photoURL?: string } = {},
): LeaderboardState {
  const [state, setState] = useState<Omit<LeaderboardState, "refresh">>({
    loading: true,
  });
  // Drops answers from an older load that finish after a newer one.
  const latest = useRef(0);
  const { displayName, photoURL } = me;

  const load = useCallback(async () => {
    // The list doesn't need your XP; only your rank does. So it loads even
    // while your XP is loading, or if it failed to.
    if (!uid) return;
    const id = ++latest.current;
    setState((current) => ({ ...current, loading: true }));
    try {
      const result =
        scope === "friends"
          ? await loadFriends(uid, xp, { displayName, photoURL })
          : await loadEveryone(uid, xp);
      if (id !== latest.current) return;
      setState({ ...result, updatedAt: new Date(), loading: false });
    } catch (error) {
      if (id !== latest.current) return;
      console.error("Error loading the leaderboard:", error);
      setState((current) => ({
        ...current,
        error: error instanceof Error ? error : new Error(String(error)),
        loading: false,
      }));
    }
  }, [uid, xp, scope, displayName, photoURL]);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), LEADERBOARD_REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  return { ...state, refresh: () => void load() };
}
