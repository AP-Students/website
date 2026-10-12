"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getCountFromServer,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ActivityEvent } from "@/types/dashboard";

export const ACTIVITY_PAGE_SIZE = 20;
type PageCursor = QueryDocumentSnapshot<DocumentData> | null;

export function useActivityPage(uid: string | undefined) {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCursors, setPageCursors] = useState<PageCursor[]>([null]);
  const [pageEndCursor, setPageEndCursor] = useState<PageCursor>(null);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setPageIndex(0);
    setPageCursors([null]);
    setEvents([]);
    setHasNext(false);
    setTotalPages(null);
  }, [uid]);

  const cursor = pageCursors[pageIndex] ?? null;

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    setError(false);

    const ownEvents = where("userId", "==", uid);
    let cancelled = false;

    const unsubscribe = onSnapshot(
      cursor
        ? query(
            collection(db, "activityEvents"),
            ownEvents,
            orderBy("occurredAt", "desc"),
            startAfter(cursor),
            limit(ACTIVITY_PAGE_SIZE + 1),
          )
        : query(
            collection(db, "activityEvents"),
            ownEvents,
            orderBy("occurredAt", "desc"),
            limit(ACTIVITY_PAGE_SIZE + 1),
          ),
      (snapshot) => {
        const pageDocuments = snapshot.docs.slice(0, ACTIVITY_PAGE_SIZE);
        setEvents(
          pageDocuments.map(
            (item) => ({ ...item.data(), id: item.id }) as ActivityEvent,
          ),
        );
        setHasNext(snapshot.docs.length > ACTIVITY_PAGE_SIZE);
        setPageEndCursor(pageDocuments.at(-1) ?? null);
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
  }, [uid, cursor]);

  const nextPage = () => {
    if (!hasNext || !pageEndCursor || loading) return;
    const nextPageIndex = pageIndex + 1;
    setPageCursors((currentCursors) => {
      const updatedCursors = [...currentCursors];
      updatedCursors[nextPageIndex] = pageEndCursor;
      return updatedCursors;
    });
    setPageIndex(nextPageIndex);
  };

  const previousPage = () => {
    if (pageIndex === 0 || loading) return;
    setPageIndex(pageIndex - 1);
  };

  return {
    events,
    page: pageIndex + 1,
    hasNext,
    totalPages,
    loading,
    error,
    nextPage,
    previousPage,
  };
}
