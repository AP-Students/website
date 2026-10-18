/**
 * Debounced, single-flight autosave for the admin editors.
 *
 * Kept free of React so the timing rules can be tested with `node --test`; the
 * editors use it through `useAutosave`. "Unsaved" means the serialized draft
 * differs from what was last written, or from what a save in flight is writing,
 * not "something was typed": undoing back to the stored content is clean again
 * once no save is writing something else, and a re-render that rebuilds an equal
 * draft never triggers a write.
 */

/** `idle` until `load` has set a baseline; nothing is saved before then. */
export type AutosaveStatus = "idle" | "saved" | "pending" | "saving" | "error";

export interface AutosaveState {
  status: AutosaveStatus;
  /** True while the draft differs from what was last stored, including mid-save. */
  hasUnsavedChanges: boolean;
  error: string | null;
}

export interface AutosaveTimers {
  setTimeout: (callback: () => void, ms: number) => unknown;
  clearTimeout: (handle: unknown) => void;
}

export interface AutosaveControllerOptions<T> {
  save: (value: T) => Promise<void>;
  onStateChange: (state: AutosaveState) => void;
  serialize?: (value: T) => string;
  delayMs?: number;
  timers?: AutosaveTimers;
}

export interface AutosaveController<T> {
  /** Sets what counts as saved: the freshly loaded document, or one just reset. */
  load: (value: T) => void;
  update: (value: T) => void;
  /**
   * Saves now instead of waiting out the delay, after any save in flight.
   * Resolves true once nothing is left unsaved. `force` writes even when
   * clean, which is what a manual Save button has always done.
   */
  flush: (options?: { force?: boolean }) => Promise<boolean>;
  /** Stops reporting state, after one last save of anything still unsaved. */
  dispose: () => void;
  isLoaded: () => boolean;
  getState: () => AutosaveState;
}

export const AUTOSAVE_DELAY_MS = 2500;

const defaultTimers: AutosaveTimers = {
  setTimeout: (callback, ms) => globalThis.setTimeout(callback, ms),
  clearTimeout: (handle) =>
    globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export const createAutosaveController = <T>({
  save,
  onStateChange,
  serialize = (value) => JSON.stringify(value),
  delayMs = AUTOSAVE_DELAY_MS,
  timers = defaultTimers,
}: AutosaveControllerOptions<T>): AutosaveController<T> => {
  let latest: T | undefined;
  let latestSignature: string | null = null;
  let savedSignature: string | null = null;
  // The draft whose save failed. A retry waits for the author (Retry, or a
  // further edit) instead of hammering a rule or a dead connection every few
  // seconds.
  let failedSignature: string | null = null;
  let error: string | null = null;
  let inFlight: Promise<boolean> | null = null;
  // What the save in flight is writing. Until it settles, the stored document
  // is about to become this, so a draft undone back to `savedSignature` is
  // still unsaved: leaving then would keep the write and lose the undo.
  let inFlightSignature: string | null = null;
  let timer: unknown = null;
  // Bumped by `load`, so a save that started before a reset cannot overwrite
  // the baseline the reset just set.
  let generation = 0;
  let disposed = false;
  let state: AutosaveState = {
    status: "idle",
    hasUnsavedChanges: false,
    error: null,
  };

  const isDirty = () =>
    savedSignature !== null &&
    (latestSignature !== savedSignature ||
      (inFlightSignature !== null && latestSignature !== inFlightSignature));

  const emit = () => {
    if (disposed) {
      return;
    }

    const dirty = isDirty();
    const status: AutosaveStatus =
      savedSignature === null
        ? "idle"
        : inFlight
          ? "saving"
          : !dirty
            ? "saved"
            : failedSignature === latestSignature
              ? "error"
              : "pending";
    const next: AutosaveState = {
      status,
      hasUnsavedChanges: dirty,
      error: status === "error" ? error : null,
    };

    if (
      next.status !== state.status ||
      next.hasUnsavedChanges !== state.hasUnsavedChanges ||
      next.error !== state.error
    ) {
      state = next;
      onStateChange(state);
    }
  };

  const clearTimer = () => {
    if (timer !== null) {
      timers.clearTimeout(timer);
      timer = null;
    }
  };

  const arm = () => {
    clearTimer();
    timer = timers.setTimeout(() => {
      timer = null;

      // A save already running re-checks for newer edits when it settles.
      if (!inFlight && isDirty()) {
        void startSave();
      }
    }, delayMs);
  };

  const startSave = (): Promise<boolean> => {
    clearTimer();

    const snapshot = latest as T;
    // Captured before the write, never re-serialized after it. Edits made
    // during the save can mutate objects the snapshot shares, and reading them
    // back afterwards would record those edits as saved when they were not.
    const attempted = latestSignature;
    const startedIn = generation;

    let written: Promise<void>;

    // Called synchronously so "saving" is reported when the write starts; a
    // saver that throws before returning its promise is still a failed save.
    try {
      written = Promise.resolve(save(snapshot));
    } catch (caught) {
      written = Promise.reject(caught);
    }

    const attempt: Promise<boolean> = written
      .then(
        () => {
          if (startedIn === generation) {
            savedSignature = attempted;
            failedSignature = null;
            error = null;
          }

          return true;
        },
        (caught: unknown) => {
          if (startedIn === generation) {
            failedSignature = attempted;
            error =
              caught instanceof Error
                ? caught.message
                : "Unknown error while saving.";
          }

          return false;
        },
      )
      .then((succeeded) => {
        inFlight = null;
        inFlightSignature = null;

        // Edits typed during the save get their own debounce, unless they are
        // exactly the draft that just failed.
        if (!disposed && isDirty() && failedSignature !== latestSignature) {
          arm();
        }

        emit();

        return succeeded;
      });

    inFlight = attempt;
    inFlightSignature = attempted;
    emit();

    return attempt;
  };

  return {
    load(value) {
      clearTimer();
      generation += 1;
      latest = value;
      latestSignature = serialize(value);
      savedSignature = latestSignature;
      failedSignature = null;
      error = null;
      emit();
    },

    update(value) {
      if (disposed) {
        return;
      }

      latest = value;
      const signature = serialize(value);

      if (signature === latestSignature) {
        return;
      }

      latestSignature = signature;

      if (savedSignature === null) {
        return;
      }

      if (!isDirty()) {
        clearTimer();
      } else if (!inFlight) {
        // Restarted on every edit, so a burst of typing is one write.
        arm();
      }

      emit();
    },

    async flush({ force = false } = {}) {
      clearTimer();

      while (inFlight) {
        await inFlight;
      }

      if (disposed || savedSignature === null) {
        return !isDirty();
      }

      // Settling the earlier save may have armed a timer for edits made
      // during it; this save covers them.
      clearTimer();

      if (!force && !isDirty()) {
        return true;
      }

      const succeeded = await startSave();

      return succeeded && !isDirty();
    },

    dispose() {
      clearTimer();

      if (disposed) {
        return;
      }

      disposed = true;

      if (savedSignature === null) {
        return;
      }

      // The admin links save before leaving, but the browser's Back and
      // Forward buttons unmount the editor without asking. Cancelling the
      // timer alone would drop the edits still waiting out the delay, and an
      // edit (or undo) made during a save would never follow it. A draft whose
      // save just failed is not retried on the way out: leaving by a link has
      // just offered to discard it, and the same write would likely fail again.
      const saveWhatIsLeft = () => {
        if (isDirty() && failedSignature !== latestSignature) {
          void startSave();
        }
      };

      if (inFlight) {
        void inFlight.then(saveWhatIsLeft);
      } else {
        saveWhatIsLeft();
      }
    },

    isLoaded: () => savedSignature !== null,

    getState: () => state,
  };
};
