import assert from "node:assert/strict";
import { test } from "node:test";
import { Timestamp } from "firebase/firestore";
import {
  chapterListing,
  inProgressEntryId,
  readInProgress,
  type StoredDocument,
} from "../src/lib/dashboard/inProgress.ts";
import {
  LOADING,
  createInProgressStore,
  type ListSnapshot,
  type ListenToList,
} from "../src/lib/dashboard/inProgressStore.ts";

const at = (iso: string) => Timestamp.fromDate(new Date(iso));

const mcqTest = (
  refId: string,
  updatedAt: string,
  overrides: Record<string, unknown> = {},
): StoredDocument => ({
  id: `ada_mcq_test_${refId}`,
  data: {
    kind: "mcq_test",
    subject: "ap-calculus-ab",
    unitId: "unit-5",
    refId,
    label: "Unit 5 Test",
    href: `/subject/ap-calculus-ab/unit-5-abc/test/${refId}`,
    startedAt: at("2026-09-20T16:00:00Z"),
    updatedAt: at(updatedAt),
    state: {
      answers: { "0": ["B"], "1": ["D"] },
      currentIndex: 2,
      secondsRemaining: 1_740,
    },
    ...overrides,
  },
});

const frqDraft = (refId: string, updatedAt: string): StoredDocument => ({
  id: `ada_frq_${refId}`,
  data: {
    kind: "frq",
    subject: "ap-english-literature",
    unitId: "unit-3",
    refId,
    label: "Argument Essay",
    href: `/subject/ap-english-literature/unit-3-abc/frq/${refId}`,
    startedAt: at("2026-09-18T15:00:00Z"),
    updatedAt: at(updatedAt),
    state: { responses: { thesis: "Slant rhyme unsettles closure." } },
  },
});

const chapter = (
  chapterId: string,
  updatedAt: string | undefined,
  overrides: Record<string, unknown> = {},
): StoredDocument => ({
  id: chapterId,
  data: {
    progress: "Reading",
    subject: "ap-physics-2",
    unitId: "unit-3",
    label: "Gauss's Law",
    href: `/subject/ap-physics-2/unit-3-abc/chapter/${chapterId}/gauss-law`,
    ...(updatedAt && { updatedAt: at(updatedAt) }),
    ...overrides,
  },
});

const ids = (entries: ReturnType<typeof readInProgress> | undefined) =>
  entries?.map(inProgressEntryId);

test("tests, FRQs and chapters are listed together, newest first", () => {
  const entries = readInProgress(
    [
      mcqTest("calc-u5", "2026-09-20T16:52:00Z"),
      frqDraft("englit-frq-1", "2026-09-19T21:20:00Z"),
      mcqTest("envsci-u6", "2026-09-18T18:10:00Z"),
    ],
    [
      chapter("gauss-law", "2026-09-20T17:30:00Z"),
      chapter("curve-sketching", "2026-09-19T08:00:00Z", {
        progress: "Practicing",
      }),
      chapter("block-ciphers", "2026-09-21T09:00:00Z", {
        progress: "Need Review",
      }),
    ],
  );

  assert.deepEqual(ids(entries), [
    "reading-block-ciphers",
    "reading-gauss-law",
    "ada_mcq_test_calc-u5",
    "ada_frq_englit-frq-1",
    "reading-curve-sketching",
    "ada_mcq_test_envsci-u6",
  ]);
});

test("entries saved at the same moment keep a fixed order", () => {
  const sameTime = "2026-09-20T12:00:00Z";
  const items = [mcqTest("b-test", sameTime), mcqTest("a-test", sameTime)];
  const chapters = [chapter("z-chapter", sameTime)];

  const once = ids(readInProgress(items, chapters));
  const reversed = ids(
    readInProgress([...items].reverse(), [...chapters].reverse()),
  );
  assert.deepEqual(once, reversed);
});

test("chapters that are done, untouched, or can't be linked to are left out", () => {
  const entries = readInProgress(
    [],
    [
      chapter("done", "2026-09-20T12:00:00Z", { progress: "Complete" }),
      chapter("skipped", "2026-09-20T12:00:00Z", { progress: "Skipped" }),
      chapter("not-started", "2026-09-20T12:00:00Z", {
        progress: "Not Started",
      }),
      // Marked before the tracker saved a title, link and time.
      { id: "legacy", data: { progress: "Reading" } },
      chapter("no-time", undefined),
      chapter("off-site", "2026-09-20T12:00:00Z", {
        href: "https://example.com/phish",
      }),
      chapter("kept", "2026-09-20T12:00:00Z"),
    ],
  );

  assert.deepEqual(ids(entries), ["reading-kept"]);
});

test("a saved test or draft that can't be shown or resumed is left out", () => {
  const entries = readInProgress(
    [
      mcqTest("no-kind", "2026-09-20T12:00:00Z", { kind: "reading" }),
      mcqTest("no-label", "2026-09-20T12:00:00Z", { label: "" }),
      mcqTest("no-time", "2026-09-20T12:00:00Z", { updatedAt: "yesterday" }),
      mcqTest("bad-index", "2026-09-20T12:00:00Z", {
        state: { answers: {}, currentIndex: -1, secondsRemaining: 60 },
      }),
      mcqTest("bad-answers", "2026-09-20T12:00:00Z", {
        state: { answers: { "0": "B" }, currentIndex: 0, secondsRemaining: 60 },
      }),
      mcqTest("frq-state", "2026-09-20T12:00:00Z", {
        state: { responses: { thesis: "..." } },
      }),
      mcqTest("kept", "2026-09-20T12:00:00Z"),
    ],
    [],
  );

  assert.deepEqual(ids(entries), ["ada_mcq_test_kept"]);
  const [kept] = entries;
  assert.equal(kept?.kind, "mcq_test");
  if (kept?.kind === "mcq_test") {
    assert.deepEqual(kept.state, {
      answers: { 0: ["B"], 1: ["D"] },
      currentIndex: 2,
      secondsRemaining: 1_740,
    });
  }
});

test("a chapter's listing comes from its page and title", () => {
  const path =
    "/subject/biology/unit-1-xgxskm69/chapter/0kvtm3P4/structure-of-water";
  assert.deepEqual(chapterListing(path, "  Structure of Water "), {
    subject: "biology",
    unitId: "unit-1",
    label: "Structure of Water",
    href: path,
  });
  assert.equal(chapterListing("/admin/editor/preview", "Draft"), null);
});

interface FakeListener {
  uid: string;
  send: (snapshot: ListSnapshot) => void;
  fail: (error: Error) => void;
  closed: boolean;
}

/** A stand-in for Firestore that records every listener opened, per list. */
function fakeFirestore() {
  const opened = {
    items: [] as FakeListener[],
    chapters: [] as FakeListener[],
  };
  const listenTo =
    (list: FakeListener[]): ListenToList =>
    (uid, onSnapshot, onError) => {
      const listener: FakeListener = {
        uid,
        send: onSnapshot,
        fail: onError,
        closed: false,
      };
      list.push(listener);
      return () => {
        listener.closed = true;
      };
    };
  const store = createInProgressStore({
    items: listenTo(opened.items),
    chapters: listenTo(opened.chapters),
  });
  return { store, opened };
}

const fromServer = (docs: StoredDocument[]) => ({ fromCache: false, docs });
const fromCache = (docs: StoredDocument[]) => ({ fromCache: true, docs });

test("the list waits for the server to answer for both tests and chapters", () => {
  const { store, opened } = fakeFirestore();
  store.subscribe("ada", () => undefined);
  assert.equal(store.getState("ada"), LOADING);

  opened.items[0]!.send(
    fromServer([mcqTest("calc-u5", "2026-09-20T16:52:00Z")]),
  );
  assert.equal(store.getState("ada"), LOADING);

  // Offline, Firestore reports a list it hasn't fetched as empty.
  opened.chapters[0]!.send(fromCache([]));
  assert.equal(store.getState("ada"), LOADING);

  opened.chapters[0]!.send(
    fromServer([chapter("gauss-law", "2026-09-20T17:30:00Z")]),
  );
  assert.deepEqual(ids(store.getState("ada").entries), [
    "reading-gauss-law",
    "ada_mcq_test_calc-u5",
  ]);
});

test("whatever the student touched last moves to the top", () => {
  const { store, opened } = fakeFirestore();
  let updates = 0;
  store.subscribe("ada", () => updates++);

  opened.items[0]!.send(
    fromServer([
      mcqTest("calc-u5", "2026-09-20T16:52:00Z"),
      frqDraft("englit-frq-1", "2026-09-19T21:20:00Z"),
    ]),
  );
  opened.chapters[0]!.send(
    fromServer([chapter("gauss-law", "2026-09-20T17:30:00Z")]),
  );
  assert.deepEqual(ids(store.getState("ada").entries), [
    "reading-gauss-law",
    "ada_mcq_test_calc-u5",
    "ada_frq_englit-frq-1",
  ]);

  // The student goes back to the FRQ and its draft is saved again.
  opened.items[0]!.send(
    fromServer([
      mcqTest("calc-u5", "2026-09-20T16:52:00Z"),
      frqDraft("englit-frq-1", "2026-09-20T18:05:00Z"),
    ]),
  );
  assert.deepEqual(ids(store.getState("ada").entries), [
    "ada_frq_englit-frq-1",
    "reading-gauss-law",
    "ada_mcq_test_calc-u5",
  ]);
  assert.equal(updates, 2);
});

test("losing the connection goes back to loading until the server confirms again", () => {
  const { store, opened } = fakeFirestore();
  store.subscribe("ada", () => undefined);
  opened.items[0]!.send(
    fromServer([mcqTest("calc-u5", "2026-09-20T16:52:00Z")]),
  );
  opened.chapters[0]!.send(fromServer([]));
  assert.equal(store.getState("ada").entries?.length, 1);

  opened.items[0]!.send(
    fromCache([mcqTest("calc-u5", "2026-09-20T16:52:00Z")]),
  );
  assert.equal(store.getState("ada"), LOADING);

  opened.items[0]!.send(fromServer([]));
  assert.deepEqual(store.getState("ada").entries, []);
});

test("another cached answer while loading doesn't wake readers", () => {
  const { store, opened } = fakeFirestore();
  let updates = 0;
  store.subscribe("ada", () => updates++);

  opened.items[0]!.send(fromCache([]));
  opened.chapters[0]!.send(fromCache([]));
  opened.items[0]!.send(fromServer([]));
  assert.equal(updates, 0);
});

test("a read error on either list is shown, not a partial list", () => {
  const { store, opened } = fakeFirestore();
  let updates = 0;
  store.subscribe("ada", () => updates++);
  opened.items[0]!.send(
    fromServer([mcqTest("calc-u5", "2026-09-20T16:52:00Z")]),
  );

  const error = new Error("permission-denied");
  opened.chapters[0]!.fail(error);
  assert.equal(store.getState("ada").error, error);
  assert.equal(store.getState("ada").entries, undefined);

  // The tests list still answering doesn't hide the failure.
  opened.items[0]!.send(fromServer([]));
  assert.equal(store.getState("ada").error, error);
  assert.equal(updates, 1);
});

test("readers of the same student share one pair of listeners", () => {
  const { store, opened } = fakeFirestore();
  let dashboardUpdates = 0;
  let askUpdates = 0;
  store.subscribe("ada", () => dashboardUpdates++);
  store.subscribe("ada", () => askUpdates++);
  store.subscribe("grace", () => undefined);

  assert.deepEqual(
    opened.items.map((listener) => listener.uid),
    ["ada", "grace"],
  );
  assert.deepEqual(
    opened.chapters.map((listener) => listener.uid),
    ["ada", "grace"],
  );

  opened.items[0]!.send(fromServer([]));
  opened.chapters[0]!.send(fromServer([]));
  assert.equal(dashboardUpdates, 1);
  assert.equal(askUpdates, 1);
});

test("both listeners close when the last reader leaves, and nothing is kept", () => {
  const { store, opened } = fakeFirestore();
  const stopDashboard = store.subscribe("ada", () => undefined);
  const stopAsk = store.subscribe("ada", () => undefined);
  opened.items[0]!.send(fromServer([]));
  opened.chapters[0]!.send(fromServer([]));

  stopDashboard();
  assert.equal(opened.items[0]!.closed, false);
  assert.equal(opened.chapters[0]!.closed, false);

  stopAsk();
  assert.equal(opened.items[0]!.closed, true);
  assert.equal(opened.chapters[0]!.closed, true);
  assert.equal(store.getState("ada"), LOADING);

  // Stopping twice doesn't close a newer reader's listeners.
  store.subscribe("ada", () => undefined);
  stopAsk();
  assert.equal(opened.items[1]!.closed, false);
  assert.equal(opened.chapters[1]!.closed, false);
});
