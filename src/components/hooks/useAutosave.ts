"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createAutosaveController,
  type AutosaveController,
  type AutosaveState,
} from "@/lib/autosave";

interface UseAutosaveOptions<T> {
  /** The whole draft. Memoize it, so an unrelated re-render is not an edit. */
  value: T;
  /** Writes the draft it is handed. Throw to report the save as failed. */
  save: (value: T) => Promise<void>;
  /**
   * False until the document has loaded. The draft on the render this turns
   * true becomes the saved baseline, so the loading placeholder can never be
   * written over what is stored.
   */
  enabled: boolean;
  /** What counts as a change, for drafts that carry noise like timestamps. */
  serialize?: (value: T) => string;
}

export function useAutosave<T>({
  value,
  save,
  enabled,
  serialize,
}: UseAutosaveOptions<T>) {
  const [state, setState] = useState<AutosaveState>({
    status: "idle",
    hasUnsavedChanges: false,
    error: null,
  });
  const controllerRef = useRef<AutosaveController<T> | null>(null);
  // Read through refs so the controller, which outlives renders, always calls
  // the latest closures.
  const saveRef = useRef(save);
  const serializeRef = useRef(serialize);

  useEffect(() => {
    saveRef.current = save;
    serializeRef.current = serialize;
  });

  // Created in an effect, not during render, so StrictMode's mount-unmount-
  // mount gets a fresh controller instead of reusing a disposed one.
  useEffect(() => {
    const controller = createAutosaveController<T>({
      save: (snapshot) => saveRef.current(snapshot),
      serialize: (draft) =>
        serializeRef.current ? serializeRef.current(draft) : JSON.stringify(draft),
      onStateChange: setState,
    });

    controllerRef.current = controller;

    return () => {
      controller.dispose();
      controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const controller = controllerRef.current;

    if (!controller || !enabled) {
      return;
    }

    if (controller.isLoaded()) {
      controller.update(value);
    } else {
      controller.load(value);
    }
  }, [value, enabled]);

  /** Saves whatever is pending; for leaving the page. */
  const flush = useCallback(
    () => controllerRef.current?.flush() ?? Promise.resolve(true),
    [],
  );

  /** Writes now even if nothing changed, as the manual Save button always has. */
  const saveNow = useCallback(
    () => controllerRef.current?.flush({ force: true }) ?? Promise.resolve(false),
    [],
  );

  /** Re-baselines after the page itself rewrote the document. */
  const reset = useCallback((next: T) => {
    controllerRef.current?.load(next);
  }, []);

  return { ...state, flush, saveNow, reset };
}
