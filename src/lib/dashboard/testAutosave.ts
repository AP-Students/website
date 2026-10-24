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
}): TestAutosave {
  const { read, save, remove, schedule = everyFewSeconds } = options;
  let running = true;
  let finished = false;
  // What the last save sent, to skip ticks where nothing changed.
  let lastSaved: string | undefined;

  // A test that has only been opened isn't in progress yet, or every test a
  // student clicks into by mistake would sit on their dashboard. Saving starts
  // once they answer something or move to another question.
  const whereTheyAre = ({ answers, currentIndex }: McqTestState) =>
    JSON.stringify({ answers, currentIndex });
  const openedAt = whereTheyAre(read());
  let started = false;

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
