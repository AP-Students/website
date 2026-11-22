"use client";

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
  return createPortal(
    <div
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
