import { useEffect, useState } from "react";
import {
  isPaused,
  pauseTimer,
  readTimer,
  resumeTimer,
  startTimer,
  usedMs,
  type TimerReading,
} from "@/lib/testTimer";

export interface TestTimer extends TimerReading {
  paused: boolean;
  pause: () => void;
  resume: () => void;
}

// Starts counting when the component mounts, and starts over if the time
// limit changes (it can arrive after the test has rendered). `stopped`
// freezes the clock for good, e.g. once the test is submitted.
export function useTestTimer(limitSeconds: number, stopped = false): TestTimer {
  const [state, setState] = useState(() => startTimer(Date.now()));
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const started = Date.now();
    setState(startTimer(started));
    setNow(started);
  }, [limitSeconds]);

  const running = !stopped && !isPaused(state);
  useEffect(() => {
    if (!running) return;
    // Faster than once a second so the display never skips a second.
    const tick = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(tick);
  }, [running]);

  return {
    ...readTimer(limitSeconds, usedMs(state, now)),
    paused: isPaused(state),
    pause: () => {
      const at = Date.now();
      setNow(at);
      setState((current) => pauseTimer(current, at));
    },
    resume: () => {
      const at = Date.now();
      setNow(at);
      setState((current) => resumeTimer(current, at));
    },
  };
}
