import assert from "node:assert/strict";
import { test } from "node:test";
import { getMonthGrid, getStreakDayKeys, toDateKey, getDisplayStreak, intensityLevel } from "../src/lib/dashboard/dates.ts";


test("toDateKey pads month and day", () => {
  assert.equal(toDateKey(new Date(2026, 8, 4)), "2026-09-04"); 
});

test("September 2026 starts on Tuesday, so one blank cell", () => {
  const grid = getMonthGrid(2026, 8);
  assert.equal(grid[0], null);
  assert.equal(grid[1]?.getDate(), 1);
  assert.equal(grid.length, 1 + 30); // 1 blank + 30 days
});

test("February in a leap year has 29 days", () => {
  const days = getMonthGrid(2028, 1).filter((cell) => cell !== null);
  assert.equal(days.length, 29);
});

test("a month starting on Sunday gets 6 blanks", () => {
  const grid = getMonthGrid(2026, 1); // Feb 1, 2026 is a Sunday
  assert.equal(grid.slice(0, 6).every((cell) => cell === null), true);
  assert.equal(grid[6]?.getDate(), 1);
});

test("a streak counts back across a month boundary", () => {
  const days = getStreakDayKeys("2026-09-02", 4);
  assert.deepEqual(
    [...days],
    ["2026-09-02", "2026-09-01", "2026-08-31", "2026-08-30"],
  );
});

test("no last active day or a 0 streak means no streak days", () => {
  assert.equal(getStreakDayKeys(null, 5).size, 0);
  assert.equal(getStreakDayKeys("2026-09-24", 0).size, 0);
});

test("a streak is shown if the last activity was today or yesterday", () => {
  const today = new Date(2026, 8, 24); // Sep 24
  assert.equal(getDisplayStreak(5, "2026-09-24", today), 5);
  assert.equal(getDisplayStreak(5, "2026-09-23", today), 5);
});

test("a streak older than yesterday is broken and shows 0", () => {
  const today = new Date(2026, 8, 24);
  assert.equal(getDisplayStreak(5, "2026-09-22", today), 0);
  assert.equal(getDisplayStreak(5, null, today), 0);
});

test("yesterday works across a month boundary", () => {
  const today = new Date(2026, 9, 1); // Oct 1
  assert.equal(getDisplayStreak(3, "2026-09-30", today), 3);
});

test("intensity levels match the 1/3/6/10 thresholds", () => {
  assert.deepEqual([0, 1, 2, 3, 5, 6, 9, 10, 25].map(intensityLevel), [0, 1, 1, 2, 2, 3, 3, 4, 4]);
});

