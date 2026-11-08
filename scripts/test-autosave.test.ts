import assert from "node:assert/strict";
import { test } from "node:test";
import { Timestamp } from "firebase/firestore";
import { readInProgressItem } from "../src/lib/dashboard/inProgress.ts";
import { pathContext } from "../src/lib/savedItemPayload.ts";
import {
  AUTOSAVE_EVERY_MS,
  createTestAutosave,
  mcqTestProgress,
  resumeTest,
  testSaveId,
  type Schedule,
} from "../src/lib/dashboard/testAutosave.ts";
import type { McqTestState } from "../src/types/dashboard.ts";

/**
 * An autosave whose clock is driven by hand, recording every write it makes
 * in order, the way Firestore would apply them.
 */
function fakeAutosave(initial: McqTestState, resumed = false) {
  let state = initial;
  const writes: ({ saved: McqTestState } | "removed")[] = [];
  let tick = () => undefined as void;
  let every = 0;
  let cancelled = false;
  const schedule: Schedule = (onTick, ms) => {
    tick = onTick;
    every = ms;
    return () => {
      cancelled = true;
    };
  };
  const autosave = createTestAutosave({
    read: () => state,
    save: async (saved) => {
      writes.push({ saved });
    },
    remove: async () => {
      writes.push("removed");
    },
    schedule,
    resumed,
  });
  return {
    autosave,
    writes,
    tick: () => tick(),
    every: () => every,
    cancelled: () => cancelled,
    set: (changes: Partial<McqTestState>) => {
      state = { ...state, ...changes };
    },
  };
}

const opened: McqTestState = {
  answers: {},
  currentIndex: 0,
  secondsRemaining: 2_700,
};

test("a test in progress is saved every few seconds", () => {
  const session = fakeAutosave(opened);
  assert.equal(session.every(), AUTOSAVE_EVERY_MS);
  assert.ok(AUTOSAVE_EVERY_MS <= 10_000);

  session.set({ answers: { 0: ["B"] }, secondsRemaining: 2_696 });
  session.tick();
  session.set({ currentIndex: 1, secondsRemaining: 2_691 });
  session.tick();

  assert.deepEqual(session.writes, [
    {
      saved: {
        answers: { 0: ["B"] },
        currentIndex: 0,
        secondsRemaining: 2_696,
      },
    },
    {
      saved: {
        answers: { 0: ["B"] },
        currentIndex: 1,
        secondsRemaining: 2_691,
      },
    },
  ]);
});

test("a test that has only been opened isn't saved, even as its timer runs", () => {
  const session = fakeAutosave(opened);
  session.tick();
  session.set({ secondsRemaining: 2_690 });
  session.tick();
  session.autosave.stop();
  assert.deepEqual(session.writes, []);

  // Moving to another question counts as starting, answered or not.
  const moved = fakeAutosave(opened);
  moved.set({ currentIndex: 1 });
  moved.tick();
  assert.equal(moved.writes.length, 1);
});

test("a tick where nothing changed saves nothing", () => {
  const session = fakeAutosave(opened);
  session.set({ answers: { 0: ["B"] } });
  session.tick();
  session.tick();
  session.autosave.flush();
  assert.equal(session.writes.length, 1);
});

test("submitting clears the save, and nothing is saved after it", () => {
  const session = fakeAutosave(opened);
  session.set({ answers: { 0: ["B"], 1: ["D"] }, currentIndex: 1 });
  session.tick();

  session.autosave.finish();
  assert.deepEqual(session.writes.at(-1), "removed");
  assert.equal(session.cancelled(), true);

  // A tick already queued, the page closing, a second submit: none of them
  // may bring the save back.
  session.set({ secondsRemaining: 2_000 });
  session.tick();
  session.autosave.flush();
  session.autosave.stop();
  session.autosave.finish();
  assert.deepEqual(session.writes, [
    {
      saved: {
        answers: { 0: ["B"], 1: ["D"] },
        currentIndex: 1,
        secondsRemaining: 2_700,
      },
    },
    "removed",
  ]);
});

test("submitting before the first save still clears any older save", () => {
  const session = fakeAutosave(opened);
  session.autosave.finish();
  assert.deepEqual(session.writes, ["removed"]);
});

test("leaving the page saves the latest answers and keeps them", () => {
  const session = fakeAutosave(opened);
  session.set({ answers: { 0: ["A"] } });
  session.tick();
  session.set({ secondsRemaining: 2_698 });

  session.autosave.stop();
  session.tick();
  assert.deepEqual(session.writes, [
    {
      saved: {
        answers: { 0: ["A"] },
        currentIndex: 0,
        secondsRemaining: 2_700,
      },
    },
    {
      saved: {
        answers: { 0: ["A"] },
        currentIndex: 0,
        secondsRemaining: 2_698,
      },
    },
  ]);
  assert.equal(session.cancelled(), true);
});

test("a save that fails is sent again on the next tick", async () => {
  let attempts = 0;
  let tick = () => undefined as void;
  let state = opened;
  createTestAutosave({
    read: () => state,
    save: async () => {
      attempts++;
      if (attempts === 1) throw new Error("unavailable");
    },
    remove: async () => undefined,
    schedule: (onTick) => {
      tick = onTick;
      return () => undefined;
    },
  });
  const quiet = console.error;
  console.error = () => undefined;
  try {
    state = { ...opened, answers: { 0: ["B"] } };
    tick();
    // Let the failed save's rejection settle.
    await new Promise((resolve) => setImmediate(resolve));
    tick();
    tick();
  } finally {
    console.error = quiet;
  }
  assert.equal(attempts, 2);
});

test("what the autosave writes is what the dashboard lists", () => {
  const path = "/subject/biology/unit-2-xgxskm69/test/u2-test";
  const context = pathContext(path);
  assert.ok(context);
  const saved = mcqTestProgress({
    context,
    label: "  Unit 2 Test ",
    href: path,
    startedAt: Timestamp.fromDate(new Date("2026-10-20T16:00:00Z")),
    state: {
      answers: { 0: ["B"], 3: ["A", "C"] },
      currentIndex: 4,
      secondsRemaining: 1_739.6,
    },
  });
  // Firestore stores map keys as strings.
  const stored = JSON.parse(JSON.stringify(saved.state)) as unknown;
  const updatedAt = Timestamp.fromDate(new Date("2026-10-20T16:12:00Z"));

  const item = readInProgressItem({
    id: "save",
    data: { ...saved, state: stored, updatedAt },
  });
  assert.deepEqual(item, {
    id: "save",
    kind: "mcq_test",
    subject: "biology",
    unitId: "unit-2",
    refId: "u2-test",
    label: "Unit 2 Test",
    href: path,
    startedAt: saved.startedAt,
    updatedAt,
    state: {
      answers: { 0: ["B"], 3: ["A", "C"] },
      currentIndex: 4,
      secondsRemaining: 1_740,
    },
  });
});

test("tests with the same id in different units never share a save", () => {
  const unit1 = testSaveId({ subject: "biology", unitId: "u1", testId: "t" });
  const unit2 = testSaveId({ subject: "biology", unitId: "u2", testId: "t" });
  const chemistry = testSaveId({
    subject: "chemistry",
    unitId: "u1",
    testId: "t",
  });
  assert.equal(new Set([unit1, unit2, chemistry]).size, 3);
  // Usable as one Firestore document id.
  for (const id of [unit1, unit2, chemistry]) {
    assert.ok(!id.includes("/"));
  }
  assert.equal(
    testSaveId({ subject: "biology", unitId: "u1", testId: "t" }),
    unit1,
  );
});

test("a test picked back up saves its time left straight away", () => {
  const session = fakeAutosave(
    { answers: { 0: ["B"] }, currentIndex: 3, secondsRemaining: 1_200 },
    true,
  );
  session.set({ secondsRemaining: 1_195 });
  session.tick();
  assert.deepEqual(session.writes, [
    {
      saved: {
        answers: { 0: ["B"] },
        currentIndex: 3,
        secondsRemaining: 1_195,
      },
    },
  ]);
});

/** A four-question test with options A-D, and 45 minutes. */
const fourQuestions = {
  questions: Array.from({ length: 4 }, () => ({
    options: ["A", "B", "C", "D"].map((id) => ({ id })),
  })),
  seconds: 2_700,
};

test("a saved test opens on the same question, with its answers and time left", () => {
  // As Firestore hands it back: map keys are strings.
  const fromFirestore = JSON.parse(
    JSON.stringify({
      answers: { 0: ["B"], 2: ["A", "C"] },
      currentIndex: 2,
      secondsRemaining: 1_740,
    }),
  ) as McqTestState;

  assert.deepEqual(resumeTest(fromFirestore, fourQuestions), {
    answers: { 0: ["B"], 2: ["A", "C"] },
    currentIndex: 2,
    secondsRemaining: 1_740,
  });
});

test("with no save there's nothing to pick up", () => {
  assert.equal(resumeTest(undefined, fourQuestions), null);
  assert.equal(resumeTest(opened, { questions: [], seconds: 2_700 }), null);
});

test("answers that no longer match the test are dropped, and the question stays in range", () => {
  // The test lost its last two questions and option D after this was saved.
  const edited = {
    questions: Array.from({ length: 2 }, () => ({
      options: ["A", "B", "C"].map((id) => ({ id })),
    })),
    seconds: 2_700,
  };
  const resumed = resumeTest(
    {
      answers: { 0: ["D"], 1: ["A", "D"], 3: ["B"] },
      currentIndex: 3,
      secondsRemaining: 900,
    },
    edited,
  );
  assert.deepEqual(resumed, {
    answers: { 1: ["A"] },
    currentIndex: 1,
    secondsRemaining: 900,
  });
});

test("the time left never goes over the test's limit, or below zero", () => {
  const shortened = { ...fourQuestions, seconds: 600 };
  assert.equal(
    resumeTest({ ...opened, secondsRemaining: 1_800 }, shortened)
      ?.secondsRemaining,
    600,
  );
  assert.equal(
    resumeTest({ ...opened, secondsRemaining: -5 }, fourQuestions)
      ?.secondsRemaining,
    0,
  );
});

test("a question asked for in the link wins over the saved one", () => {
  const saved = {
    answers: { 0: ["B"] },
    currentIndex: 2,
    secondsRemaining: 900,
  };
  assert.equal(resumeTest(saved, fourQuestions, 0)?.currentIndex, 0);
  // No question in the link reads as -1; a bad one is ignored.
  assert.equal(resumeTest(saved, fourQuestions, -1)?.currentIndex, 2);
  assert.equal(resumeTest(saved, fourQuestions, Number.NaN)?.currentIndex, 2);
  assert.equal(resumeTest(saved, fourQuestions, 9)?.currentIndex, 2);
});
