import { readStudentStats, type StudentStats } from "./stats.ts";

/**
 * One live subscription to each student's stats, shared by everything that
 * reads them.
 *
 * The first reader of a student's stats opens the listener and the last one
 * to leave closes it, so a page with several readers (the dashboard's XP card
 * and streak bar, Ask, Oogway) still has one subscription and parses each
 * update once. Nothing outlives the listener: when it closes, its stats are
 * dropped, and the next reader starts from loading.
 *
 * This module knows nothing about Firestore or React, so it can be tested on
 * its own; `useLiveStats` connects it to both.
 */

export interface LiveStatsState {
  /** Undefined while loading, and after a read error. */
  stats?: StudentStats;
  /**
   * Set when the stats couldn't be read. Kept separate so a failure is never
   * shown as a real "Level 1, 0 XP".
   */
  error?: Error;
}

/** What a stats listener reports: the stored document, and where it came from. */
export interface StatsSnapshot {
  /** True when Firestore answered from its local cache, not the server. */
  fromCache: boolean;
  data: Record<string, unknown> | undefined;
}

/** Opens a listener on one student's stats and returns a function to close it. */
export type ListenToStats = (
  uid: string,
  onSnapshot: (snapshot: StatsSnapshot) => void,
  onError: (error: Error) => void,
) => () => void;

/** One shared object, so a reader that is still loading doesn't re-render. */
export const LOADING: LiveStatsState = Object.freeze({});

interface Subscription {
  state: LiveStatsState;
  readers: Set<() => void>;
  close: () => void;
}

export interface LiveStatsStore {
  /**
   * Starts reading `uid`'s stats. `onChange` runs whenever they change; the
   * returned function stops reading.
   */
  subscribe(uid: string, onChange: () => void): () => void;
  /** Loading until someone is subscribed and the server has answered. */
  getState(uid: string): LiveStatsState;
}

export function createLiveStatsStore(
  listen: ListenToStats,
  getTimeZone: () => string,
): LiveStatsStore {
  const subscriptions = new Map<string, Subscription>();

  function open(uid: string): Subscription {
    const subscription: Subscription = {
      state: LOADING,
      readers: new Set(),
      close: () => undefined,
    };
    const publish = (state: LiveStatsState) => {
      if (state === subscription.state) return;
      subscription.state = state;
      subscription.readers.forEach((onChange) => onChange());
    };

    subscription.close = listen(
      uid,
      ({ fromCache, data }) =>
        // A cached answer is never shown. Offline, or before the server's
        // first reply, a document Firestore hasn't fetched reads as missing,
        // which looks like a brand-new student, and one it has fetched may
        // be out of date. So any cached answer, including the one Firestore
        // sends when the connection drops, means loading until the server
        // confirms the stats again.
        publish(
          fromCache
            ? LOADING
            : { stats: readStudentStats(data, getTimeZone()) },
        ),
      (error) => publish({ error }),
    );
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
