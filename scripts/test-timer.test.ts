import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatClock,
  isPaused,
  pauseTimer,
  readTimer,
  resumeTimer,
  startTimer,
  usedMs,
} from "../src/lib/testTimer.ts";

const SECOND = 1000;

test("counts down from the limit as time passes", () => {
  const timer = startTimer(0);
  assert.deepEqual(readTimer(60, usedMs(timer, 0)), {
    remaining: 60,
    overtime: 0,
    timeUp: false,
  });
  assert.equal(readTimer(60, usedMs(timer, 15 * SECOND)).remaining, 45);
  // Part of a second doesn't count yet.
  assert.equal(readTimer(60, usedMs(timer, 15.9 * SECOND)).remaining, 45);
});

test("pausing stops the clock and resuming carries on from there", () => {
  let timer = startTimer(0);
  timer = pauseTimer(timer, 10 * SECOND);
  assert.equal(isPaused(timer), true);
  // A long pause doesn't use any time.
  assert.equal(usedMs(timer, 500 * SECOND), 10 * SECOND);
  timer = resumeTimer(timer, 500 * SECOND);
  assert.equal(isPaused(timer), false);
  assert.equal(readTimer(60, usedMs(timer, 505 * SECOND)).remaining, 45);
});

test("several pauses add up correctly", () => {
  let timer = startTimer(0);
  timer = pauseTimer(timer, 5 * SECOND);
  timer = resumeTimer(timer, 100 * SECOND);
  timer = pauseTimer(timer, 110 * SECOND);
  timer = resumeTimer(timer, 200 * SECOND);
  assert.equal(usedMs(timer, 205 * SECOND), 20 * SECOND);
});

test("pausing twice or resuming while running changes nothing", () => {
  const running = startTimer(0);
  assert.equal(resumeTimer(running, 50 * SECOND), running);
  const paused = pauseTimer(running, 10 * SECOND);
  assert.equal(pauseTimer(paused, 90 * SECOND), paused);
});

test("after the limit it counts overtime instead of going negative", () => {
  const timer = startTimer(0);
  assert.deepEqual(readTimer(60, usedMs(timer, 60 * SECOND)), {
    remaining: 0,
    overtime: 0,
    timeUp: true,
  });
  assert.deepEqual(readTimer(60, usedMs(timer, 135 * SECOND)), {
    remaining: 0,
    overtime: 75,
    timeUp: true,
  });
});

test("overtime pauses too", () => {
  let timer = startTimer(0);
  timer = pauseTimer(timer, 70 * SECOND);
  assert.equal(readTimer(60, usedMs(timer, 999 * SECOND)).overtime, 10);
});

test("a clock that jumps backwards doesn't add time", () => {
  const timer = startTimer(100 * SECOND);
  assert.equal(usedMs(timer, 50 * SECOND), 0);
});

test("the clock reads hours, minutes and seconds", () => {
  assert.equal(formatClock(0), "0:00:00");
  assert.equal(formatClock(59), "0:00:59");
  assert.equal(formatClock(3909), "1:05:09");
  assert.equal(formatClock(90 * 60), "1:30:00");
  assert.equal(formatClock(-5), "0:00:00");
});
