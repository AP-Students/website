import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildCalendarWeeks,
  countByDay,
  intensityLevel,
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
