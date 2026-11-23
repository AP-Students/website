import { useEffect, useState } from "react";
import {
  collection,
  documentId,
  endAt,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAt,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface FriendRow {
  uid: string;
  /** Null if they no longer have one (their account was deleted). */
  username: string | null;
}

export interface FriendsState {
  friends?: FriendRow[];
  incoming?: FriendRow[];
  outgoing?: FriendRow[];
  error?: Error;
}

// Usernames for a list of uids. The rules cap username lists at 20, so the
// lookup goes 20 at a time.
async function usernamesFor(uids: string[]): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  for (let i = 0; i < uids.length; i += 20) {
    const batch = uids.slice(i, i + 20);
    const found = await getDocs(
      query(collection(db, "usernames"), where("uid", "in", batch), limit(20)),
    );
    found.docs.forEach((entry) => {
      const uid: unknown = entry.data().uid;
      if (typeof uid === "string") names.set(uid, entry.id);
    });
  }
  return names;
}

const byName = (a: FriendRow, b: FriendRow) =>
  (a.username ?? "~").localeCompare(b.username ?? "~");

// Your friends and pending requests, kept live.
export function useFriends(uid: string | undefined): FriendsState {
  const [friendUids, setFriendUids] = useState<string[]>();
  const [friends, setFriends] = useState<FriendRow[]>();
  const [incoming, setIncoming] = useState<FriendRow[]>();
  const [outgoing, setOutgoing] = useState<FriendRow[]>();
  const [error, setError] = useState<Error>();

  useEffect(() => {
    if (!uid) return;
    const fail = (err: Error) => {
      console.error("Error loading friends:", err);
      setError(err);
    };
    const requests = collection(db, "friendRequests");
    const stops = [
      onSnapshot(
        collection(db, "users", uid, "friends"),
        (snapshot) => setFriendUids(snapshot.docs.map((friend) => friend.id)),
        fail,
      ),
      onSnapshot(
        query(requests, where("to", "==", uid)),
        (snapshot) =>
          setIncoming(
            snapshot.docs
              .map((request) => ({
                uid: String(request.data().from),
                username: String(request.data().fromUsername ?? "") || null,
              }))
              .sort(byName),
          ),
        fail,
      ),
      onSnapshot(
        query(requests, where("from", "==", uid)),
        (snapshot) =>
          setOutgoing(
            snapshot.docs
              .map((request) => ({
                uid: String(request.data().to),
                username: String(request.data().toUsername ?? "") || null,
              }))
              .sort(byName),
          ),
        fail,
      ),
    ];
    return () => stops.forEach((stop) => stop());
  }, [uid]);

  // Looked up each time the list changes, so a renamed friend shows their
  // current username.
  useEffect(() => {
    if (!friendUids) return;
    let cancelled = false;
    usernamesFor(friendUids)
      .then((names) => {
        if (cancelled) return;
        setFriends(
          friendUids
            .map((friendUid) => ({
              uid: friendUid,
              username: names.get(friendUid) ?? null,
            }))
            .sort(byName),
        );
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err);
      });
    return () => {
      cancelled = true;
    };
  }, [friendUids]);

  return { friends, incoming, outgoing, error };
}

// Usernames starting with `prefix`, for the search box.
export async function searchUsernames(
  prefix: string,
): Promise<Array<{ uid: string; username: string }>> {
  const found = await getDocs(
    query(
      collection(db, "usernames"),
      orderBy(documentId()),
      startAt(prefix),
      endAt(`${prefix}`),
      limit(10),
    ),
  );
  return found.docs.map((entry) => ({
    uid: String(entry.data().uid),
    username: entry.id,
  }));
}
