import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NO_STREAK,
  readStreakState,
  recordActiveDay,
  resolveActivityDay,
  streakAsOf,
  type StreakState,
} from "../src/lib/gamification/streak.ts";

const studyOn = (days: string[], from: StreakState = NO_STREAK) =>
  days.reduce(recordActiveDay, from);

test("the first activity ever starts a 1-day streak", () => {
  assert.deepEqual(recordActiveDay(NO_STREAK, "2026-09-20"), {
    currentStreak: 1,
    longestStreak: 1,
    lastActiveDay: "2026-09-20",
  });
});

test("more activity on the same day doesn't add to the streak", () => {
  const streak = studyOn(["2026-09-20", "2026-09-21"]);
  assert.equal(recordActiveDay(streak, "2026-09-21"), streak);
});

test("the first activity of the next day extends the streak", () => {
  assert.deepEqual(studyOn(["2026-09-20", "2026-09-21", "2026-09-22"]), {
    currentStreak: 3,
    longestStreak: 3,
    lastActiveDay: "2026-09-22",
  });
});

test("missing a day starts over at 1 but keeps the record", () => {
  const streak = studyOn([
    "2026-09-20",
    "2026-09-21",
    "2026-09-22",
    // Nothing on the 23rd.
    "2026-09-24",
  ]);
  assert.deepEqual(streak, {
    currentStreak: 1,
    longestStreak: 3,
    lastActiveDay: "2026-09-24",
  });
});

test("the record only moves once the new streak passes it", () => {
  const record = studyOn(["2026-09-01", "2026-09-02"]);
  const catchingUp = studyOn(["2026-09-10", "2026-09-11"], record);
  assert.equal(catchingUp.longestStreak, 2);
  assert.equal(recordActiveDay(catchingUp, "2026-09-12").longestStreak, 3);
});

test("a streak carries across month, year, and leap-day boundaries", () => {
  assert.equal(studyOn(["2026-09-30", "2026-10-01"]).currentStreak, 2);
  assert.equal(studyOn(["2026-12-31", "2027-01-01"]).currentStreak, 2);
  assert.equal(
    studyOn(["2028-02-28", "2028-02-29", "2028-03-01"]).currentStreak,
    3,
  );
});

test("a day before the last active one is ignored, not rewound to", () => {
  const streak = studyOn(["2026-09-20", "2026-09-21"]);
  assert.equal(recordActiveDay(streak, "2026-09-20"), streak);
  assert.equal(recordActiveDay(streak, "2026-09-01"), streak);
});

test("a streak is still alive on the day after the last activity", () => {
  const streak = studyOn(["2026-09-20", "2026-09-21"]);
  assert.equal(streakAsOf(streak, "2026-09-21"), 2);
  assert.equal(streakAsOf(streak, "2026-09-22"), 2);
});

test("a streak reads as 0 once a whole day has been missed", () => {
  const streak = studyOn(["2026-09-20", "2026-09-21"]);
  assert.equal(streakAsOf(streak, "2026-09-23"), 0);
  assert.equal(streakAsOf(NO_STREAK, "2026-09-23"), 0);
});

test("yesterday is found across a month boundary", () => {
  assert.equal(streakAsOf(studyOn(["2026-09-30"]), "2026-10-01"), 1);
});

test("a last active day ahead of today (after a zone change) still counts", () => {
  assert.equal(streakAsOf(studyOn(["2026-09-21"]), "2026-09-20"), 1);
});

test("the first activity uses the reported zone", () => {
  // 04:30 UTC on the 23rd is still the evening of the 22nd in Los Angeles.
  const now = new Date("2026-09-23T04:30:00Z");
  assert.deepEqual(resolveActivityDay(now, undefined, "America/Los_Angeles"), {
    day: "2026-09-22",
    timeZone: "America/Los_Angeles",
  });
});

test("a missing or unknown zone falls back to the one on file, then UTC", () => {
  const now = new Date("2026-09-23T04:30:00Z");
  assert.deepEqual(
    resolveActivityDay(now, "America/Los_Angeles", "Not/AZone"),
    { day: "2026-09-22", timeZone: "America/Los_Angeles" },
  );
  assert.deepEqual(resolveActivityDay(now, null, 42), {
    day: "2026-09-23",
    timeZone: "UTC",
  });
});

test("moving east takes effect straight away", () => {
  const now = new Date("2026-09-23T04:30:00Z");
  assert.deepEqual(
    resolveActivityDay(now, "America/Los_Angeles", "America/New_York"),
    { day: "2026-09-23", timeZone: "America/New_York" },
  );
});

test("claiming a zone further west can't turn today back into yesterday", () => {
  // Just after midnight on the 23rd in New York. Claiming Los Angeles would
  // make it the 22nd again and could fill in a day that was missed.
  const now = new Date("2026-09-23T04:30:00Z");
  assert.deepEqual(
    resolveActivityDay(now, "America/New_York", "America/Los_Angeles"),
    { day: "2026-09-23", timeZone: "America/Los_Angeles" },
  );
  // From the next activity on, days are counted in Los Angeles.
  assert.deepEqual(
    resolveActivityDay(
      new Date("2026-09-24T04:30:00Z"),
      "America/Los_Angeles",
      "America/Los_Angeles",
    ),
    { day: "2026-09-23", timeZone: "America/Los_Angeles" },
  );
});

test("stored streak fields are read back as they were written", () => {
  assert.deepEqual(
    readStreakState({
      currentStreak: 4,
      longestStreak: 9,
      lastActiveDay: "2026-09-21",
      xp: 120,
    }),
    { currentStreak: 4, longestStreak: 9, lastActiveDay: "2026-09-21" },
  );
});

test("a missing or malformed stats document reads as no streak", () => {
  assert.deepEqual(readStreakState(undefined), NO_STREAK);
  assert.deepEqual(
    readStreakState({
      currentStreak: -2,
      longestStreak: "7",
      lastActiveDay: "2026-02-30",
    }),
    NO_STREAK,
  );
  assert.equal(readStreakState({ currentStreak: 2.5 }).currentStreak, 0);
});

test("a record lower than the current streak is raised to match it", () => {
  assert.equal(
    readStreakState({ currentStreak: 6, longestStreak: 2 }).longestStreak,
    6,
  );
});
