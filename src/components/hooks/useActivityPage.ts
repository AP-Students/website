"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getCountFromServer,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ActivityEvent } from "@/types/dashboard";

export const ACTIVITY_PAGE_SIZE = 20;

export function useActivityPage(uid: string | undefined, page: number) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setEvents([]);
    setHasNext(false);
    setTotalPages(null);
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    setError(false);

    const ownEvents = where("userId", "==", uid);
    const end = page * ACTIVITY_PAGE_SIZE;
    let cancelled = false;

    const unsubscribe = onSnapshot(
      query(
        collection(db, "activityEvents"),
        ownEvents,
        orderBy("occurredAt", "desc"),
        limit(end + 1),
      ),
      (snapshot) => {
        const all = snapshot.docs.map(
          (item) => ({ ...item.data(), id: item.id }) as ActivityEvent,
        );

        setEvents(all.slice(end - ACTIVITY_PAGE_SIZE, end));
        setHasNext(all.length > end);
        setLoading(false);

        getCountFromServer(query(collection(db, "activityEvents"), ownEvents))
          .then((count) => {
            if (cancelled) return;
            setTotalPages(
              Math.max(1, Math.ceil(count.data().count / ACTIVITY_PAGE_SIZE)),
            );
          })
          .catch((countError: unknown) =>
            console.error("Unable to count activity", countError),
          );
      },
      (loadError) => {
        console.error("Unable to load activity", loadError);
        setError(true);
        setLoading(false);
      },
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [uid, page]);

  return { events, hasNext, totalPages, loading, error };
}
