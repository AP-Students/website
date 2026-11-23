import assert from "node:assert/strict";
import { test } from "node:test";
import { readStudentStats } from "../src/lib/gamification/stats.ts";

const DEVICE_ZONE = "America/Los_Angeles";

test("no stats document is a student who hasn't started", () => {
  assert.deepEqual(readStudentStats(undefined, DEVICE_ZONE), {
    xp: { xp: 0, level: 1, xpIntoLevel: 0, xpForNextLevel: 100 },
    streak: { currentStreak: 0, longestStreak: 0, lastActiveDay: null },
    timeZone: DEVICE_ZONE,
    readingsCompleted: 0,
    mcqTestsCompleted: 0,
    problemsSolved: 0,
    frqsSubmitted: 0,
    subjectsCompleted: 0,
    perSubject: {},
  });
});

test("stored stats are read as written", () => {
  const stats = readStudentStats(
    {
      xp: 260,
      level: 3,
      currentStreak: 4,
      longestStreak: 9,
      lastActiveDay: "2026-09-20",
      timeZone: "America/New_York",
      readingsCompleted: 12,
      mcqTestsCompleted: 5,
      problemsSolved: 43,
      frqsSubmitted: 2,
      subjectsCompleted: 1,
      perSubject: {
        "ap-physics-2": {
          subjectSlug: "ap-physics-2",
          attempted: 50,
          correct: 43,
          readingsCompleted: 12,
          totalReadings: 30,
        },
      },
    },
    DEVICE_ZONE,
  );

  assert.deepEqual(stats.xp, {
    xp: 260,
    level: 3,
    xpIntoLevel: 10,
    xpForNextLevel: 200,
  });
  assert.deepEqual(stats.streak, {
    currentStreak: 4,
    longestStreak: 9,
    lastActiveDay: "2026-09-20",
  });
  assert.equal(stats.timeZone, "America/New_York");
  assert.equal(stats.readingsCompleted, 12);
  assert.equal(stats.mcqTestsCompleted, 5);
  assert.equal(stats.problemsSolved, 43);
  assert.equal(stats.frqsSubmitted, 2);
  assert.equal(stats.subjectsCompleted, 1);
  assert.deepEqual(stats.perSubject, {
    "ap-physics-2": {
      attempted: 50,
      correct: 43,
      readingsCompleted: 12,
      totalReadings: 30,
    },
  });
});

test("the level comes from the XP total, not the stored level", () => {
  // Two students with the same XP must always show the same level.
  const stats = readStudentStats({ xp: 260, level: 1 }, DEVICE_ZONE);
  assert.equal(stats.xp.level, 3);
});

test("an unusable count reads as 0 and doesn't affect the others", () => {
  const stats = readStudentStats(
    {
      readingsCompleted: -3,
      mcqTestsCompleted: 2.5,
      problemsSolved: "43",
      frqsSubmitted: Number.NaN,
      subjectsCompleted: 2,
    },
    DEVICE_ZONE,
  );
  assert.equal(stats.readingsCompleted, 0);
  assert.equal(stats.mcqTestsCompleted, 0);
  assert.equal(stats.problemsSolved, 0);
  assert.equal(stats.frqsSubmitted, 0);
  assert.equal(stats.subjectsCompleted, 2);
});

test("a missing or unknown time zone falls back to the device's", () => {
  assert.equal(readStudentStats({ xp: 10 }, DEVICE_ZONE).timeZone, DEVICE_ZONE);
  assert.equal(
    readStudentStats({ timeZone: "Mars/Olympus_Mons" }, DEVICE_ZONE).timeZone,
    DEVICE_ZONE,
  );
});

test("a subject entry that isn't an object is skipped", () => {
  const stats = readStudentStats(
    {
      perSubject: {
        "ap-biology": "corrupt",
        "ap-chemistry": null,
        "ap-calculus-ab": { attempted: 3, correct: "2" },
      },
    },
    DEVICE_ZONE,
  );
  assert.deepEqual(stats.perSubject, {
    "ap-calculus-ab": {
      attempted: 3,
      correct: 0,
      readingsCompleted: 0,
      totalReadings: 0,
    },
  });
});

test("perSubject that isn't a map reads as no subjects", () => {
  assert.deepEqual(
    readStudentStats({ perSubject: ["ap-biology"] }, DEVICE_ZONE).perSubject,
    {},
  );
});
