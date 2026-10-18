import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createAutosaveController,
  type AutosaveState,
  type AutosaveTimers,
} from "../src/lib/autosave.ts";

const DELAY = 2500;

/** A clock the test advances by hand, so debounce timing is exact. */
const createClock = () => {
  let now = 0;
  let nextId = 1;
  const pending = new Map<number, { at: number; callback: () => void }>();

  const timers: AutosaveTimers = {
    setTimeout: (callback, ms) => {
      const id = nextId++;
      pending.set(id, { at: now + ms, callback });
      return id;
    },
    clearTimeout: (handle) => {
      pending.delete(handle as number);
    },
  };

  const advance = (ms: number) => {
    now += ms;

    for (const [id, entry] of [...pending.entries()]) {
      if (entry.at <= now) {
        pending.delete(id);
        entry.callback();
      }
    }
  };

  return { timers, advance, pendingCount: () => pending.size };
};

/** Saves that settle only when the test says so. */
const createSaver = () => {
  const calls: { value: string; resolve: () => void; reject: (e: Error) => void }[] =
    [];

  const save = (value: string) =>
    new Promise<void>((resolve, reject) => {
      calls.push({ value, resolve, reject });
    });

  return { save, calls };
};

const flushMicrotasks = () => new Promise((resolve) => setImmediate(resolve));

const setup = () => {
  const clock = createClock();
  const saver = createSaver();
  const states: AutosaveState[] = [];
  const controller = createAutosaveController<string>({
    save: saver.save,
    onStateChange: (state) => states.push(state),
    delayMs: DELAY,
    timers: clock.timers,
  });

  return { clock, saver, states, controller };
};

test("nothing is saved before the document has loaded", () => {
  const { clock, saver, controller } = setup();

  controller.update("draft typed into the loading placeholder");
  clock.advance(DELAY * 2);

  assert.equal(saver.calls.length, 0);
  assert.equal(controller.getState().status, "idle");
});

test("loading sets the baseline without writing it back", () => {
  const { clock, saver, controller } = setup();

  controller.load("stored");
  clock.advance(DELAY * 2);

  assert.equal(saver.calls.length, 0);
  assert.deepEqual(controller.getState(), {
    status: "saved",
    hasUnsavedChanges: false,
    error: null,
  });
});

test("a burst of edits is one save of the last draft, after the delay", async () => {
  const { clock, saver, controller } = setup();
  controller.load("a");

  controller.update("ab");
  clock.advance(1000);
  controller.update("abc");
  clock.advance(1000);
  controller.update("abcd");

  assert.equal(controller.getState().status, "pending");
  assert.equal(controller.getState().hasUnsavedChanges, true);

  clock.advance(DELAY - 1);
  assert.equal(saver.calls.length, 0, "the delay restarts on every edit");

  clock.advance(1);
  assert.equal(saver.calls.length, 1);
  assert.equal(saver.calls[0]!.value, "abcd");
  assert.equal(controller.getState().status, "saving");

  saver.calls[0]!.resolve();
  await flushMicrotasks();

  assert.deepEqual(controller.getState(), {
    status: "saved",
    hasUnsavedChanges: false,
    error: null,
  });
});

test("undoing back to the stored content is clean and saves nothing", () => {
  const { clock, saver, controller } = setup();
  controller.load("stored");

  controller.update("edited");
  controller.update("stored");
  clock.advance(DELAY * 2);

  assert.equal(saver.calls.length, 0);
  assert.equal(controller.getState().status, "saved");
  assert.equal(clock.pendingCount(), 0);
});

test("an edit made during a save is saved next, never concurrently", async () => {
  const { clock, saver, controller } = setup();
  controller.load("v0");

  controller.update("v1");
  clock.advance(DELAY);
  assert.equal(saver.calls.length, 1);

  controller.update("v2");
  clock.advance(DELAY * 3);
  assert.equal(saver.calls.length, 1, "no second write while one is in flight");
  assert.equal(controller.getState().status, "saving");

  saver.calls[0]!.resolve();
  await flushMicrotasks();

  // v1 is stored, v2 is not: still unsaved, waiting out its own delay.
  assert.equal(controller.getState().status, "pending");
  assert.equal(controller.getState().hasUnsavedChanges, true);

  clock.advance(DELAY);
  assert.equal(saver.calls.length, 2);
  assert.equal(saver.calls[1]!.value, "v2");

  saver.calls[1]!.resolve();
  await flushMicrotasks();
  assert.equal(controller.getState().status, "saved");
});

test("undoing during a save stays unsaved until the undo is stored", async () => {
  const { clock, saver, controller } = setup();
  controller.load("Original");

  controller.update("Edited");
  clock.advance(DELAY);
  assert.equal(saver.calls.length, 1);

  controller.update("Original");
  assert.equal(
    controller.getState().hasUnsavedChanges,
    true,
    "the write in flight is about to store Edited, so leaving would lose the undo",
  );

  const flushed = controller.flush();
  saver.calls[0]!.resolve();
  await flushMicrotasks();
  assert.equal(saver.calls.length, 2);
  assert.equal(saver.calls[1]!.value, "Original");

  saver.calls[1]!.resolve();
  assert.equal(await flushed, true);
  assert.equal(controller.getState().hasUnsavedChanges, false);
});

test("an undo whose save fails mid-flight is clean: nothing was stored", async () => {
  const { clock, saver, controller } = setup();
  controller.load("Original");

  controller.update("Edited");
  clock.advance(DELAY);
  controller.update("Original");
  saver.calls[0]!.reject(new Error("offline"));
  await flushMicrotasks();

  assert.equal(controller.getState().status, "saved");
  assert.equal(controller.getState().hasUnsavedChanges, false);
  clock.advance(DELAY * 2);
  assert.equal(saver.calls.length, 1);
});

test("a failed save keeps the changes, reports the error, and does not loop", async () => {
  const { clock, saver, controller } = setup();
  controller.load("v0");

  controller.update("v1");
  clock.advance(DELAY);
  saver.calls[0]!.reject(new Error("Missing or insufficient permissions."));
  await flushMicrotasks();

  assert.deepEqual(controller.getState(), {
    status: "error",
    hasUnsavedChanges: true,
    error: "Missing or insufficient permissions.",
  });

  clock.advance(DELAY * 10);
  assert.equal(saver.calls.length, 1, "no automatic retry of the same draft");

  const retried = controller.flush();
  await flushMicrotasks();
  assert.equal(saver.calls.length, 2);
  assert.equal(saver.calls[1]!.value, "v1");

  saver.calls[1]!.resolve();
  assert.equal(await retried, true);
  assert.equal(controller.getState().status, "saved");
});

test("editing after a failure tries again with the newer draft", async () => {
  const { clock, saver, controller } = setup();
  controller.load("v0");

  controller.update("v1");
  clock.advance(DELAY);
  saver.calls[0]!.reject(new Error("offline"));
  await flushMicrotasks();
  assert.equal(controller.getState().status, "error");

  controller.update("v2");
  assert.equal(controller.getState().status, "pending");

  clock.advance(DELAY);
  assert.equal(saver.calls.length, 2);
  assert.equal(saver.calls[1]!.value, "v2");
});

test("flush saves a pending draft immediately and cancels its timer", async () => {
  const { clock, saver, controller } = setup();
  controller.load("v0");
  controller.update("v1");

  const flushed = controller.flush();
  await flushMicrotasks();
  assert.equal(saver.calls.length, 1);
  assert.equal(clock.pendingCount(), 0);

  saver.calls[0]!.resolve();
  assert.equal(await flushed, true);

  clock.advance(DELAY * 2);
  assert.equal(saver.calls.length, 1, "the debounced save does not also fire");
});

test("flush during a save waits for it, then saves what is left", async () => {
  const { clock, saver, controller } = setup();
  controller.load("v0");
  controller.update("v1");
  clock.advance(DELAY);
  controller.update("v2");

  const flushed = controller.flush();
  await flushMicrotasks();
  assert.equal(saver.calls.length, 1, "waits for the save in flight");

  saver.calls[0]!.resolve();
  await flushMicrotasks();
  assert.equal(saver.calls.length, 2);
  assert.equal(saver.calls[1]!.value, "v2");

  saver.calls[1]!.resolve();
  assert.equal(await flushed, true);
  assert.equal(controller.getState().status, "saved");
});

test("flush reports false when the save fails", async () => {
  const { saver, controller } = setup();
  controller.load("v0");
  controller.update("v1");

  const flushed = controller.flush();
  await flushMicrotasks();
  saver.calls[0]!.reject(new Error("network"));

  assert.equal(await flushed, false);
  assert.equal(controller.getState().hasUnsavedChanges, true);
});

test("flush with nothing unsaved writes nothing unless forced", async () => {
  const { saver, controller } = setup();
  controller.load("v0");

  assert.equal(await controller.flush(), true);
  assert.equal(saver.calls.length, 0);

  const forced = controller.flush({ force: true });
  await flushMicrotasks();
  assert.equal(saver.calls.length, 1);
  assert.equal(saver.calls[0]!.value, "v0");
  saver.calls[0]!.resolve();
  assert.equal(await forced, true);
});

test("a save that finishes after a reset does not overwrite the new baseline", async () => {
  const { clock, saver, controller } = setup();
  controller.load("v0");
  controller.update("v1");
  clock.advance(DELAY);

  controller.load("reset");
  saver.calls[0]!.resolve();
  await flushMicrotasks();

  assert.equal(controller.getState().status, "saved");
  controller.update("v1");
  assert.equal(
    controller.getState().hasUnsavedChanges,
    true,
    "v1 is not the baseline just because its save settled late",
  );
});

test("dispose saves a draft still waiting out the delay, once", async () => {
  const { clock, saver, states, controller } = setup();
  controller.load("v0");
  controller.update("v1");

  // What the browser's Back button does: the editor unmounts mid-debounce.
  controller.dispose();
  assert.equal(saver.calls.length, 1);
  assert.equal(saver.calls[0]!.value, "v1");

  const reported = states.length;
  controller.update("v2");
  saver.calls[0]!.resolve();
  await flushMicrotasks();
  clock.advance(DELAY * 2);
  assert.equal(saver.calls.length, 1, "nothing is scheduled after dispose");
  assert.equal(states.length, reported, "and nothing is reported");
});

test("dispose during a save follows it with the undo made meanwhile", async () => {
  const { clock, saver, controller } = setup();
  controller.load("Original");
  controller.update("Edited");
  clock.advance(DELAY);
  controller.update("Original");

  controller.dispose();
  assert.equal(saver.calls.length, 1, "never two writes at once");

  saver.calls[0]!.resolve();
  await flushMicrotasks();
  assert.equal(saver.calls.length, 2);
  assert.equal(saver.calls[1]!.value, "Original");
});

test("dispose does not retry a draft whose save failed", async () => {
  const { clock, saver, controller } = setup();
  controller.load("v0");
  controller.update("v1");
  clock.advance(DELAY);
  saver.calls[0]!.reject(new Error("Missing or insufficient permissions."));
  await flushMicrotasks();

  // The leave prompt has already asked whether to discard it.
  controller.dispose();
  await flushMicrotasks();
  assert.equal(saver.calls.length, 1);
});

test("dispose with nothing unsaved writes nothing", () => {
  const { saver, controller } = setup();
  controller.load("v0");
  controller.dispose();

  const unloaded = setup();
  unloaded.controller.update("typed into the loading placeholder");
  unloaded.controller.dispose();

  assert.equal(saver.calls.length, 0);
  assert.equal(unloaded.saver.calls.length, 0);
});

test("a save that throws synchronously is reported, not left in flight", async () => {
  const clock = createClock();
  const controller = createAutosaveController<string>({
    save: () => {
      throw new Error("sync failure");
    },
    onStateChange: () => undefined,
    delayMs: DELAY,
    timers: clock.timers,
  });
  controller.load("v0");
  controller.update("v1");
  clock.advance(DELAY);
  await flushMicrotasks();

  assert.equal(controller.getState().status, "error");
  assert.equal(controller.getState().error, "sync failure");
});
