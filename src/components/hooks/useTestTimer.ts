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
    // Wakes up just after each new second of used time, so the page updates
    // once a second and the clock never skips a second.
    const untilNextSecond = (at: number) =>
      1000 - (usedMs(state, at) % 1000) + 10;
    let timeout = 0;
    const tick = () => {
      const at = Date.now();
      setNow(at);
      timeout = window.setTimeout(tick, untilNextSecond(at));
    };
    timeout = window.setTimeout(tick, untilNextSecond(Date.now()));
    return () => window.clearTimeout(timeout);
  }, [running, state]);

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
