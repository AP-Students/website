"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

// Covers the whole test while the timer is paused, so a pause stops the work
// as well as the clock. Rendered into <body> so it also covers panels like the
// calculator, whatever component it's used from.
export default function PausedOverlay({
  timeLeft,
  onResume,
}: {
  timeLeft: string;
  onResume: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Covering the page isn't enough on its own: Tab would still reach the
  // answer boxes underneath. Everything else is made inert until Resume.
  useEffect(() => {
    const overlay = overlayRef.current;
    const others = [...document.body.children].filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement && element !== overlay && !element.inert,
    );
    for (const element of others) element.inert = true;
    return () => {
      for (const element of others) element.inert = false;
    };
  }, []);

  return createPortal(
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="paused-title"
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-white p-4"
    >
      <div className="text-center">
        <h2 id="paused-title" className="text-2xl font-bold">
          Test paused
        </h2>
        <p className="mt-2 text-gray-600">
          The timer is stopped at {timeLeft}. Your answers are still here.
        </p>
        <button
          type="button"
          autoFocus
          onClick={onResume}
          className="mt-6 rounded bg-blue-700 px-6 py-2 font-semibold text-white"
        >
          Resume
        </button>
      </div>
    </div>,
    document.body,
  );
}
