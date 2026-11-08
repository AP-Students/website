import { useCallback, useSyncExternalStore } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  type Query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { IN_PROGRESS_READING_STATUSES } from "@/lib/dashboard/inProgress";
import {
  createInProgressStore,
  LOADING,
  type InProgressState,
  type ListenToList,
} from "@/lib/dashboard/inProgressStore";

export type { InProgressState };
export type { InProgressEntry } from "@/lib/dashboard/inProgress";

const listenTo =
  (list: (uid: string) => Query): ListenToList =>
  (uid, onList, onError) =>
    onSnapshot(
      list(uid),
      // As in useLiveStats: without this, the server confirming what the
      // cache already said is not delivered, and readers would wait. It also
      // delivers the cached snapshot Firestore raises when the connection
      // drops, which is what sends readers back to loading.
      { includeMetadataChanges: true },
      (snapshot) =>
        onList({
          fromCache: snapshot.metadata.fromCache,
          docs: snapshot.docs.map((document) => ({
            id: document.id,
            // A change saved a moment ago has no server time yet. Its
            // estimate puts it at the top, where it belongs, instead of
            // leaving it out until the server answers.
            data: document.data({ serverTimestamps: "estimate" }),
          })),
        }),
      (error) => {
        console.error("Error loading in-progress items:", error);
        onError(error);
      },
    );

const store = createInProgressStore({
  items: listenTo((uid) => collection(db, `users/${uid}/inProgress`)),
  chapters: listenTo((uid) =>
    query(
      collection(db, `users/${uid}/chapterData`),
      where("progress", "in", [...IN_PROGRESS_READING_STATUSES]),
    ),
  ),
});

/**
 * What the signed-in student has started and not finished, newest first:
 * practice tests and FRQ drafts saved part-way, and chapters marked Reading,
 * Practicing or Need Review. Anything that shows a student, or tells Ask,
 * what they're in the middle of reads it through this hook rather than
 * opening its own listeners.
 *
 * Every component that calls it for the same student shares one pair of
 * Firestore listeners, which close when the last of them unmounts.
 *
 * Nothing is cached. Only lists the server has confirmed are returned: before
 * its first reply, and whenever the connection drops, this is loading.
 */
export function useInProgress(uid: string | undefined): InProgressState {
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
