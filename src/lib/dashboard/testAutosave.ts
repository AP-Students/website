import type { Timestamp } from "firebase/firestore";
import type { McqTestState } from "@/types/dashboard";
import type { pathContext } from "../savedItemPayload.ts";
import { inProgressItemId } from "./inProgress.ts";

/**
 * Autosave for a practice test in progress.
 *
 * While a student works through a test, its answers, current question and
 * time left are saved to `users/{uid}/inProgress` every few seconds. That is
 * what the dashboard's In Progress list shows, and what a student will pick
 * the test back up from. Submitting the test deletes the save.
 *
 * Kept free of React and of Firestore, so it can be tested on its own;
 * `useTestAutosave` connects it to both.
 */

/** How often a test in progress is saved. */
export const AUTOSAVE_EVERY_MS = 5_000;

/** Where a test lives. `unitId` is the unit's Firestore id, not "unit-3". */
export interface TestSource {
  subject: string;
  unitId: string;
  testId: string;
}

/** The id of a test's save in `users/{uid}/inProgress`. */
export const testSaveId = (source: TestSource) =>
  inProgressItemId("mcq_test", {
    subject: source.subject,
    unitId: source.unitId,
    refId: source.testId,
  });

/**
 * The saved document for a test in progress, apart from `updatedAt`, which
 * the server stamps. `context` and `href` come from the test page's URL, so
 * the dashboard labels and links to it the same way as a saved question.
 */
export function mcqTestProgress(input: {
  context: NonNullable<ReturnType<typeof pathContext>>;
  label: string;
  href: string;
  startedAt: Timestamp;
  state: McqTestState;
}) {
  const { context, label, href, startedAt, state } = input;
  return {
    kind: "mcq_test" as const,
    subject: context.subject,
    unitId: context.unitId,
    refId: context.refId,
    label: (label.trim() || "Practice Test").slice(0, 200),
    href,
    startedAt,
    state: {
      answers: { ...state.answers },
      currentIndex: state.currentIndex,
      secondsRemaining: Math.max(0, Math.round(state.secondsRemaining)),
    },
  };
}

/**
 * Where a student picks a saved test back up, checked against the test as it
 * is now, since it may have been edited since: answers to questions or
 * options that no longer exist are dropped, the question stays in range, and
 * the time left never goes over the test's limit. A question asked for in
 * the link (`requestedIndex`, as "Go to question" sends) wins over the saved
 * one. Null when there's nothing to pick up.
 */
export function resumeTest(
  saved: McqTestState | undefined,
  test: { questions: { options: { id: string }[] }[]; seconds: number },
  requestedIndex = -1,
): McqTestState | null {
  if (!saved || test.questions.length === 0) return null;

  const answers: Record<number, string[]> = {};
  for (const [key, choices] of Object.entries(saved.answers)) {
    const index = Number(key);
    const options = test.questions[index]?.options.map((option) => option.id);
    const kept = choices.filter((choice) => options?.includes(choice));
    if (kept.length > 0) answers[index] = kept;
  }

  const last = test.questions.length - 1;
  return {
    answers,
    currentIndex:
      requestedIndex >= 0 && requestedIndex <= last
        ? requestedIndex
        : Math.min(saved.currentIndex, last),
    secondsRemaining: Math.min(
      Math.max(0, saved.secondsRemaining),
      test.seconds,
    ),
  };
}

export interface TestAutosave {
  /** Saves now, if anything changed since the last save. */
  flush(): void;
  /** Saves what's left unsaved and stops. The save stays, to pick up later. */
  stop(): void;
  /** The test was submitted: stops saving and deletes the save. */
  finish(): void;
}

/** Calls `tick` every `every` ms until the returned function is called. */
export type Schedule = (tick: () => void, every: number) => () => void;

const everyFewSeconds: Schedule = (tick, every) => {
  const timer = setInterval(tick, every);
  return () => clearInterval(timer);
};

export function createTestAutosave(options: {
  /** The test as it stands now. */
  read: () => McqTestState;
  save: (state: McqTestState) => Promise<void>;
  remove: () => Promise<void>;
  schedule?: Schedule;
  /** Picked back up from a save, so it's in progress from the first tick. */
  resumed?: boolean;
}): TestAutosave {
  const {
    read,
    save,
    remove,
    schedule = everyFewSeconds,
    resumed = false,
  } = options;
  let running = true;
  let finished = false;
  // What the last save sent, to skip ticks where nothing changed.
  let lastSaved: string | undefined;

  // A test that has only been opened isn't in progress yet, or every test a
  // student clicks into by mistake would sit on their dashboard. Saving starts
  // once they answer something or move to another question. A test picked
  // back up from a save is already in progress, so its time left is saved
  // straight away.
  const whereTheyAre = ({ answers, currentIndex }: McqTestState) =>
    JSON.stringify({ answers, currentIndex });
  const openedAt = whereTheyAre(read());
  let started = resumed;

  const flush = () => {
    if (!running) return;
    const state = read();
    if (!started) {
      if (whereTheyAre(state) === openedAt) return;
      started = true;
    }
    const sent = JSON.stringify(state);
    if (sent === lastSaved) return;
    lastSaved = sent;
    save(state).catch((error) => {
      console.error("Error saving test progress:", error);
      // Sent again on the next tick, unless something newer went out since.
      if (lastSaved === sent) lastSaved = undefined;
    });
  };
  const cancel = schedule(flush, AUTOSAVE_EVERY_MS);
  const halt = () => {
    running = false;
    cancel();
  };

  return {
    flush,
    stop() {
      flush();
      halt();
    },
    finish() {
      if (finished) return;
      finished = true;
      halt();
      // Firestore applies one client's writes in the order they were made,
      // so this lands after any save still on its way, and nothing is saved
      // after it.
      remove().catch((error) =>
        console.error("Error clearing test progress:", error),
      );
    },
  };
}
