// The clock for a timed test. It works from timestamps rather than counting
// ticks, so it stays right when the browser slows timers down in a background
// tab, and pausing just stops adding time.

export interface TimerState {
  // Time used before the current run, in ms.
  usedMs: number;
  // When the current run started, or null while paused.
  runningSince: number | null;
}

export const startTimer = (now: number): TimerState => ({
  usedMs: 0,
  runningSince: now,
});

export const isPaused = (state: TimerState) => state.runningSince === null;

export function usedMs(state: TimerState, now: number): number {
  return (
    state.usedMs +
    (state.runningSince === null ? 0 : Math.max(0, now - state.runningSince))
  );
}

export function pauseTimer(state: TimerState, now: number): TimerState {
  if (state.runningSince === null) return state;
  return { usedMs: usedMs(state, now), runningSince: null };
}

export function resumeTimer(state: TimerState, now: number): TimerState {
  if (state.runningSince !== null) return state;
  return { ...state, runningSince: now };
}

export interface TimerReading {
  // Whole seconds left, never below 0.
  remaining: number;
  // Whole seconds past the limit, 0 until time is up.
  overtime: number;
  timeUp: boolean;
}

export function readTimer(limitSeconds: number, used: number): TimerReading {
  const usedSeconds = Math.floor(used / 1000);
  return {
    remaining: Math.max(0, limitSeconds - usedSeconds),
    overtime: Math.max(0, usedSeconds - limitSeconds),
    timeUp: usedSeconds >= limitSeconds,
  };
}

// 1:05:09
export function formatClock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 3600)}:${String(
    Math.floor((whole % 3600) / 60),
  ).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
}
