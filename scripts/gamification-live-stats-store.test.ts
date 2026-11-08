import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LOADING,
  createLiveStatsStore,
  type ListenToStats,
  type StatsSnapshot,
} from "../src/lib/gamification/liveStatsStore.ts";

interface FakeListener {
  uid: string;
  send: (snapshot: StatsSnapshot) => void;
  fail: (error: Error) => void;
  closed: boolean;
}

/** A stand-in for Firestore that records every listener opened. */
function fakeFirestore() {
  const opened: FakeListener[] = [];
  const listen: ListenToStats = (uid, onSnapshot, onError) => {
    const listener: FakeListener = {
      uid,
      send: onSnapshot,
      fail: onError,
      closed: false,
    };
    opened.push(listener);
    return () => {
      listener.closed = true;
    };
  };
  const store = createLiveStatsStore(listen, () => "America/Los_Angeles");
  return { store, opened };
}

const fromServer = (data: Record<string, unknown> | undefined) => ({
  fromCache: false,
  data,
});
const fromCache = (data: Record<string, unknown> | undefined) => ({
  fromCache: true,
  data,
});

test("readers of the same student share one listener", () => {
  const { store, opened } = fakeFirestore();
  let xpCardUpdates = 0;
  let streakBarUpdates = 0;
  store.subscribe("ada", () => xpCardUpdates++);
  store.subscribe("ada", () => streakBarUpdates++);

  assert.equal(opened.length, 1);

  opened[0]!.send(fromServer({ xp: 260, currentStreak: 4 }));
  assert.equal(xpCardUpdates, 1);
  assert.equal(streakBarUpdates, 1);
  assert.equal(store.getState("ada").stats?.xp.level, 3);
});

test("different students get separate listeners", () => {
  const { store, opened } = fakeFirestore();
  store.subscribe("ada", () => undefined);
  store.subscribe("grace", () => undefined);

  assert.deepEqual(
    opened.map((listener) => listener.uid),
    ["ada", "grace"],
  );
});

test("nothing is shown until the server answers", () => {
  const { store, opened } = fakeFirestore();
  store.subscribe("ada", () => undefined);
  assert.equal(store.getState("ada"), LOADING);

  // Offline, Firestore reports a document it hasn't fetched as missing.
  opened[0]!.send(fromCache(undefined));
  assert.equal(store.getState("ada"), LOADING);

  opened[0]!.send(fromServer({ xp: 260 }));
  assert.equal(store.getState("ada").stats?.xp.xp, 260);
});

test("losing the connection goes back to loading until the server confirms again", () => {
  const { store, opened } = fakeFirestore();
  let updates = 0;
  store.subscribe("ada", () => updates++);

  opened[0]!.send(fromServer({ xp: 260 }));
  // The snapshot Firestore raises when the connection drops: same data,
  // now only from the cache.
  opened[0]!.send(fromCache({ xp: 260 }));
  assert.equal(store.getState("ada"), LOADING);
  assert.equal(updates, 2);

  opened[0]!.send(fromServer({ xp: 300 }));
  assert.equal(store.getState("ada").stats?.xp.xp, 300);
});

test("another cached answer while loading doesn't wake readers", () => {
  const { store, opened } = fakeFirestore();
  let updates = 0;
  store.subscribe("ada", () => updates++);

  opened[0]!.send(fromCache(undefined));
  opened[0]!.send(fromCache({ xp: 10 }));
  assert.equal(updates, 0);
});

test("a read error reaches every reader", () => {
  const { store, opened } = fakeFirestore();
  let updates = 0;
  store.subscribe("ada", () => updates++);
  store.subscribe("ada", () => updates++);

  const error = new Error("permission-denied");
  opened[0]!.fail(error);
  assert.equal(store.getState("ada").error, error);
  assert.equal(store.getState("ada").stats, undefined);
  assert.equal(updates, 2);
});

test("the listener closes when the last reader leaves, not before", () => {
  const { store, opened } = fakeFirestore();
  const stopXpCard = store.subscribe("ada", () => undefined);
  const stopStreakBar = store.subscribe("ada", () => undefined);
  opened[0]!.send(fromServer({ xp: 260 }));

  stopXpCard();
  assert.equal(opened[0]!.closed, false);
  assert.equal(store.getState("ada").stats?.xp.xp, 260);

  stopStreakBar();
  assert.equal(opened[0]!.closed, true);
});

test("stats aren't kept once the listener closes", () => {
  const { store, opened } = fakeFirestore();
  const stop = store.subscribe("ada", () => undefined);
  opened[0]!.send(fromServer({ xp: 260 }));
  stop();

  assert.equal(store.getState("ada"), LOADING);
  store.subscribe("ada", () => undefined);
  assert.equal(opened.length, 2);
  assert.equal(store.getState("ada"), LOADING);
});

test("stopping twice doesn't close a newer reader's listener", () => {
  const { store, opened } = fakeFirestore();
  const stopFirst = store.subscribe("ada", () => undefined);
  stopFirst();
  store.subscribe("ada", () => undefined);

  stopFirst();
  assert.equal(opened[1]!.closed, false);
});
