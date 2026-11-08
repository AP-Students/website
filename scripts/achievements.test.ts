import assert from "node:assert/strict";
import { test } from "node:test";
import { checkAchievements } from "../src/lib/achievements/checkAchievements.ts";
import type { AchievementStats } from "../src/lib/achievements/definitions.ts";

const zeroStats: AchievementStats = {
  readingsCompleted: 0,
  mcqTestsCompleted: 0,
  frqsSubmitted: 0,
  problemsSolved: 0,
  subjectsCompleted: 0,
  longestStreak: 0,
  level: 1,
};

const ids = (list: { id: string }[]) => list.map((a) => a.id);

test("a brand-new user has earned nothing", () => {
  assert.deepEqual(checkAchievements(zeroStats, new Set()), []);
});

test("reaching a threshold exactly earns the achievement", () => {
  const earned = checkAchievements(
    { ...zeroStats, readingsCompleted: 5 },
    new Set(),
  );
  assert.deepEqual(ids(earned), ["reading-1", "reading-5"]);
});

test("achievements already earned are not returned again", () => {
  const earned = checkAchievements(
    { ...zeroStats, readingsCompleted: 5 },
    new Set(["reading-1"]),
  );
  assert.deepEqual(ids(earned), ["reading-5"]);
});

test("one jump in stats can earn several achievements at once", () => {
  const earned = checkAchievements(
    { ...zeroStats, longestStreak: 30 },
    new Set(),
  );
  assert.deepEqual(ids(earned), ["streak-3", "streak-7", "streak-30"]);
});
