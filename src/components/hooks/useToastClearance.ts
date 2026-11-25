"use client";

import { useEffect, useRef } from "react";

/**
 * Keeps bottom pop-ups above a fixed bottom bar, like a test's Back and Exit
 * buttons. Attach the returned ref to the bar: its height is written to
 * `--toast-clearance` on <html>, which globals.css adds to the pop-up offset.
 *
 * The bar is measured instead of assumed because its height changes: a long
 * test name wraps onto several lines on a phone and makes the bar much taller.
 */
export function useToastClearance<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const bar = ref.current;
    if (!bar) return;
    const root = document.documentElement;
    const update = () => {
      root.style.setProperty(
        "--toast-clearance",
        `${bar.getBoundingClientRect().height}px`,
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(bar);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--toast-clearance");
    };
  }, []);

  return ref;
}
