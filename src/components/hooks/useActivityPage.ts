"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getCountFromServer,
  getDocs,
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
  const [refreshCount, setRefreshCount] = useState(0);
  const [shownNewestId, setShownNewestId] = useState<string | null>();
  const [newestId, setNewestId] = useState<string | null>();

  useEffect(() => {
    setPageIndex(0);
    setPageCursors([null]);
    setEvents([]);
    setHasNext(false);
    setTotalPages(null);
    setShownNewestId(undefined);
    setNewestId(undefined);
  }, [uid]);

  const cursor = pageCursors[pageIndex] ?? null;

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    setError(false);

    const ownEvents = where("userId", "==", uid);
    let cancelled = false;

    getDocs(
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
    )
      .then((snapshot) => {
        if (cancelled) return;
        const pageDocuments = snapshot.docs.slice(0, ACTIVITY_PAGE_SIZE);
        setEvents(
          pageDocuments.map(
            (item) => ({ ...item.data(), id: item.id }) as ActivityEvent,
          ),
        );
        setHasNext(snapshot.docs.length > ACTIVITY_PAGE_SIZE);
        setPageEndCursor(pageDocuments.at(-1) ?? null);
        if (!cursor) setShownNewestId(pageDocuments[0]?.id ?? null);
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
      })
      .catch((loadError: unknown) => {
        console.error("Unable to load activity", loadError);
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [uid, cursor, refreshCount]);

  useEffect(() => {
    if (!uid) return;
    return onSnapshot(
      query(
        collection(db, "activityEvents"),
        where("userId", "==", uid),
        orderBy("occurredAt", "desc"),
        limit(1),
      ),
      (snapshot) => setNewestId(snapshot.docs[0]?.id ?? null),
      (watchError) =>
        console.error("Unable to watch for new activity", watchError),
    );
  }, [uid]);

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

  const refresh = () => {
    setPageIndex(0);
    setPageCursors([null]);
    setRefreshCount((count) => count + 1);
  };

  const hasNewActivity =
    newestId !== undefined &&
    shownNewestId !== undefined &&
    newestId !== shownNewestId;

  return {
    events,
    page: pageIndex + 1,
    hasNext,
    totalPages,
    loading,
    error,
    nextPage,
    previousPage,
    hasNewActivity,
    refresh,
  };
}
