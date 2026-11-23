import {
  readInProgress,
  type InProgressEntry,
  type StoredDocument,
} from "./inProgress.ts";

/**
 * One live view of each student's in-progress list, shared by everything that
 * shows it.
 *
 * The list is built from two listeners: one on the student's saved tests and
 * FRQ drafts, one on their chapters. As with `liveStatsStore`, the first
 * reader of a student's list opens them and the last one to leave closes
 * them, so the dashboard and Ask share one pair. Nothing outlives the
 * listeners: when they close, the list is dropped, and the next reader starts
 * from loading.
 *
 * This module knows nothing about Firestore reads or React, so it can be
 * tested on its own; `useInProgress` connects it to both.
 */

export interface InProgressState {
  /** Newest first. Undefined while loading, and after a read error. */
  entries?: InProgressEntry[];
  /**
   * Set when either list couldn't be read. Kept separate so a failure is
   * never shown as "nothing in progress".
   */
  error?: Error;
}

/** What a list listener reports: the stored documents, and where they came from. */
export interface ListSnapshot {
  /** True when Firestore answered from its local cache, not the server. */
  fromCache: boolean;
  docs: StoredDocument[];
}

/** Opens a listener on one of a student's lists and returns a function to close it. */
export type ListenToList = (
  uid: string,
  onSnapshot: (snapshot: ListSnapshot) => void,
  onError: (error: Error) => void,
) => () => void;

/** One shared object, so a reader that is still loading doesn't re-render. */
export const LOADING: InProgressState = Object.freeze({});

interface Subscription {
  state: InProgressState;
  readers: Set<() => void>;
  close: () => void;
}

export interface InProgressStore {
  /**
   * Starts reading `uid`'s in-progress list. `onChange` runs whenever it
   * changes; the returned function stops reading.
   */
  subscribe(uid: string, onChange: () => void): () => void;
  /** Loading until someone is subscribed and the server has answered for both lists. */
  getState(uid: string): InProgressState;
}

export function createInProgressStore(listen: {
  /** Saved practice tests and FRQ drafts. */
  items: ListenToList;
  /** Chapters whose progress is Reading, Practicing or Need Review. */
  chapters: ListenToList;
}): InProgressStore {
  const subscriptions = new Map<string, Subscription>();

  function open(uid: string): Subscription {
    const subscription: Subscription = {
      state: LOADING,
      readers: new Set(),
      close: () => undefined,
    };
    const publish = (state: InProgressState) => {
      if (state === subscription.state) return;
      subscription.state = state;
      subscription.readers.forEach((onChange) => onChange());
    };

    // Each list's last answer from the server. Undefined until there is one,
    // and again while only the cache is answering.
    let items: StoredDocument[] | undefined;
    let chapters: StoredDocument[] | undefined;
    // Once either list fails the other alone would be incomplete, so the
    // error stays until the listeners close.
    let failed = false;

    // A cached answer is never shown. Offline, or before the server's first
    // reply, a list Firestore hasn't fetched reads as empty, which looks like
    // a student with nothing in progress, and one it has fetched may be out
    // of date. So a cached answer for either list means loading until the
    // server confirms it again.
    const show = () => {
      if (failed) return;
      publish(
        items && chapters
          ? { entries: readInProgress(items, chapters) }
          : LOADING,
      );
    };
    const fail = (error: Error) => {
      if (failed) return;
      failed = true;
      publish({ error });
    };

    const closeItems = listen.items(
      uid,
      ({ fromCache, docs }) => {
        items = fromCache ? undefined : docs;
        show();
      },
      fail,
    );
    const closeChapters = listen.chapters(
      uid,
      ({ fromCache, docs }) => {
        chapters = fromCache ? undefined : docs;
        show();
      },
      fail,
    );
    subscription.close = () => {
      closeItems();
      closeChapters();
    };
    subscriptions.set(uid, subscription);
    return subscription;
  }

  return {
    subscribe(uid, onChange) {
      const subscription = subscriptions.get(uid) ?? open(uid);
      subscription.readers.add(onChange);
      return () => {
        subscription.readers.delete(onChange);
        // The identity check makes a second call harmless: by then a new
        // reader may have opened a fresh subscription for the same student.
        if (
          subscription.readers.size === 0 &&
          subscriptions.get(uid) === subscription
        ) {
          subscriptions.delete(uid);
          subscription.close();
        }
      };
    },
    getState(uid) {
      return subscriptions.get(uid)?.state ?? LOADING;
    },
  };
}
