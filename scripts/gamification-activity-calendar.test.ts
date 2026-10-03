import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildCalendarWeeks,
  countByDay,
  intensityLevel,
  thresholdsForMax,
} from "../src/lib/gamification/activityCalendar.ts";

test("intensity levels follow the default thresholds", () => {
  assert.equal(intensityLevel(0), 0);
  assert.equal(intensityLevel(1), 1);
  assert.equal(intensityLevel(2), 1);
  assert.equal(intensityLevel(3), 2);
  assert.equal(intensityLevel(6), 3);
  assert.equal(intensityLevel(10), 4);
  assert.equal(intensityLevel(250), 4);
});

test("intensity thresholds are configurable", () => {
  assert.equal(intensityLevel(2, [1, 2, 3, 4]), 2);
  assert.equal(intensityLevel(4, [1, 2, 3, 4]), 4);
});

test("[1,5] -> 6: a new busiest day takes the top level and earlier days shift down", () => {
  const before = thresholdsForMax(5);
  assert.equal(intensityLevel(1, before), 1);
  assert.equal(intensityLevel(5, before), 4);

  const after = thresholdsForMax(6);
  assert.equal(intensityLevel(6, after), 4);
  assert.equal(intensityLevel(5, after), 3);
  assert.equal(intensityLevel(1, after), 1);
});

test("relative intensity: a day with no activity is level 0 whatever the max", () => {
  assert.equal(intensityLevel(0, thresholdsForMax(0)), 0);
  assert.equal(intensityLevel(0, thresholdsForMax(1)), 0);
  assert.equal(intensityLevel(0, thresholdsForMax(40)), 0);
});

test("relative intensity: any activity shows, and the busiest day is level 4", () => {
  for (let max = 1; max <= 60; max++) {
    const thresholds = thresholdsForMax(max);
    assert.ok(intensityLevel(1, thresholds) >= 1, `1 hidden at max ${max}`);
    assert.equal(intensityLevel(max, thresholds), 4, `max ${max}`);
    for (let count = 1; count < max; count++) {
      assert.ok(
        intensityLevel(count, thresholds) <=
          intensityLevel(count + 1, thresholds),
        `level fell from ${count} to ${count + 1} at max ${max}`,
      );
    }
  }
});

test("countByDay buckets by the student's day, not UTC's", () => {
  const counts = countByDay(
    [
      new Date("2026-09-22T15:00:00Z"),
      new Date("2026-09-23T03:30:00Z"), // still the 22nd in Los Angeles
      new Date("2026-09-23T18:00:00Z"),
    ],
    "America/Los_Angeles",
  );
  assert.deepEqual(
    [...counts],
    [
      ["2026-09-22", 2],
      ["2026-09-23", 1],
    ],
  );
});

test("weeks start on Sunday and the last week stops at lastDay", () => {
  // 2026-09-26 is a Saturday, 2026-09-23 a Wednesday.
  const counts = new Map([["2026-09-21", 3]]);
  const weeks = buildCalendarWeeks(counts, { lastDay: "2026-09-23", weeks: 2 });

  assert.equal(weeks.length, 2);
  assert.equal(weeks[0]![0]!.day, "2026-09-13");
  assert.equal(weeks[1]![0]!.day, "2026-09-20");
  assert.deepEqual(weeks[1]![1], { day: "2026-09-21", count: 3, level: 2 });
  assert.equal(weeks[1]![3]!.day, "2026-09-23");
  assert.deepEqual(weeks[1]!.slice(4), [null, null, null]);
});

test("weeks can start on Monday", () => {
  const weeks = buildCalendarWeeks(new Map(), {
    lastDay: "2026-09-26",
    weeks: 1,
    weekStartsOn: 1,
  });
  assert.equal(weeks[0]![0]!.day, "2026-09-21");
  assert.equal(weeks[0]![5]!.day, "2026-09-26");
  assert.equal(weeks[0]![6], null);
});

test("a full year is 53 unbroken columns ending today", () => {
  const weeks = buildCalendarWeeks(new Map(), { lastDay: "2026-09-26" });
  const days = weeks.flat().filter((cell) => cell !== null);
  assert.equal(weeks.length, 53);
  assert.equal(days.at(-1)!.day, "2026-09-26");
  assert.equal(days.length, 53 * 7);
});
