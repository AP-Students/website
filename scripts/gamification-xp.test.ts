import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_XP_CONFIG,
  XP_AMOUNT_FIELDS,
  addXp,
  levelForXp,
  parseXpConfig,
  parseXpForm,
  readXpProgress,
  readXpTotal,
  streakXp,
  toXpForm,
  totalXpForLevel,
  type XpAmountField,
} from "../src/lib/gamification/xp.ts";
import {
  NO_STREAK,
  recordActiveDay,
  type StreakState,
} from "../src/lib/gamification/streak.ts";

const LABELS = Object.fromEntries(
  XP_AMOUNT_FIELDS.map((field) => [field, field]),
) as Record<XpAmountField, string>;

const studyOn = (days: string[], from: StreakState = NO_STREAK) =>
  days.reduce(recordActiveDay, from);

test("no stored config means the defaults", () => {
  assert.deepEqual(parseXpConfig(undefined), DEFAULT_XP_CONFIG);
  assert.deepEqual(parseXpConfig(null), DEFAULT_XP_CONFIG);
  assert.deepEqual(parseXpConfig("nonsense"), DEFAULT_XP_CONFIG);
});

test("stored values override the defaults field by field", () => {
  const config = parseXpConfig({ frqSubmission: 40, streakDay: 0 });
  assert.equal(config.frqSubmission, 40);
  assert.equal(config.streakDay, 0);
  assert.equal(config.mcqTestComplete, DEFAULT_XP_CONFIG.mcqTestComplete);
});

test("an unusable value falls back to its own default only", () => {
  const config = parseXpConfig({
    readingComplete: -5,
    mcqTestComplete: 2.5,
    mcqCorrectAnswer: "10",
    frqSubmission: 1_000_000,
    streakDay: 7,
  });
  assert.equal(config.readingComplete, DEFAULT_XP_CONFIG.readingComplete);
  assert.equal(config.mcqTestComplete, DEFAULT_XP_CONFIG.mcqTestComplete);
  assert.equal(config.mcqCorrectAnswer, DEFAULT_XP_CONFIG.mcqCorrectAnswer);
  assert.equal(config.frqSubmission, DEFAULT_XP_CONFIG.frqSubmission);
  assert.equal(config.streakDay, 7);
});

test("a level can't cost 0 XP, or levels would never end", () => {
  assert.equal(
    parseXpConfig({ levelBaseXp: 0 }).levelBaseXp,
    DEFAULT_XP_CONFIG.levelBaseXp,
  );
});

test("stored milestones replace the defaults, dropping bad entries", () => {
  const config = parseXpConfig({
    streakMilestones: { "5": 30, "0": 10, abc: 10, "14": -1, "21": 0, "60": 200 },
  });
  assert.deepEqual(config.streakMilestones, { "5": 30, "60": 200 });
  assert.deepEqual(parseXpConfig({ streakMilestones: {} }).streakMilestones, {});
});

test("parsing never mutates the defaults", () => {
  const config = parseXpConfig({});
  config.streakMilestones["2"] = 99;
  assert.equal(DEFAULT_XP_CONFIG.streakMilestones["2"], undefined);
});

test("everyone starts at level 1", () => {
  assert.deepEqual(levelForXp(0, DEFAULT_XP_CONFIG), {
    xp: 0,
    level: 1,
    xpIntoLevel: 0,
    xpForNextLevel: 100,
  });
});

test("each level costs the base plus one more step than the last", () => {
  assert.deepEqual(levelForXp(99, DEFAULT_XP_CONFIG), {
    xp: 99,
    level: 1,
    xpIntoLevel: 99,
    xpForNextLevel: 100,
  });
  assert.deepEqual(levelForXp(100, DEFAULT_XP_CONFIG), {
    xp: 100,
    level: 2,
    xpIntoLevel: 0,
    xpForNextLevel: 150,
  });
  assert.deepEqual(levelForXp(260, DEFAULT_XP_CONFIG), {
    xp: 260,
    level: 3,
    xpIntoLevel: 10,
    xpForNextLevel: 200,
  });
});

test("a flat curve makes every level cost the same", () => {
  const flat = { levelBaseXp: 50, levelStepXp: 0 };
  assert.equal(levelForXp(500, flat).level, 11);
  assert.equal(levelForXp(500, flat).xpForNextLevel, 50);
});

test("negative or broken totals read as 0 XP", () => {
  assert.equal(levelForXp(-20, DEFAULT_XP_CONFIG).xp, 0);
  assert.equal(levelForXp(Number.NaN, DEFAULT_XP_CONFIG).xp, 0);
  assert.equal(readXpTotal({ xp: -3 }), 0);
  assert.equal(readXpTotal({ xp: "12" }), 0);
  assert.equal(readXpTotal(undefined), 0);
  assert.equal(readXpTotal({ xp: 42 }), 42);
});

test("the XP to reach a level matches where that total lands", () => {
  for (const level of [1, 2, 3, 10, 50]) {
    const total = totalXpForLevel(level, DEFAULT_XP_CONFIG);
    assert.equal(levelForXp(total, DEFAULT_XP_CONFIG).level, level);
    assert.equal(levelForXp(total - 1, DEFAULT_XP_CONFIG).level, Math.max(1, level - 1));
  }
});

test("adding XP reports a level-up only when one happens", () => {
  assert.deepEqual(addXp(90, 5, DEFAULT_XP_CONFIG), {
    xp: 95,
    level: 1,
    xpIntoLevel: 95,
    xpForNextLevel: 100,
    leveledUp: false,
  });
  const leveled = addXp(90, 20, DEFAULT_XP_CONFIG);
  assert.equal(leveled.level, 2);
  assert.equal(leveled.xpIntoLevel, 10);
  assert.equal(leveled.leveledUp, true);
});

test("the first day of a streak earns no streak bonus", () => {
  const before = NO_STREAK;
  const after = recordActiveDay(before, "2026-09-20");
  assert.equal(streakXp(before, after, DEFAULT_XP_CONFIG), 0);
});

test("keeping a streak going earns the daily bonus", () => {
  const before = studyOn(["2026-09-20"]);
  const after = recordActiveDay(before, "2026-09-21");
  assert.equal(after.currentStreak, 2);
  assert.equal(streakXp(before, after, DEFAULT_XP_CONFIG), 5);
});

test("a second activity on the same day earns no more streak XP", () => {
  const before = studyOn(["2026-09-20", "2026-09-21"]);
  const after = recordActiveDay(before, "2026-09-21");
  assert.equal(streakXp(before, after, DEFAULT_XP_CONFIG), 0);
});

test("reaching a milestone adds its bonus to the daily one", () => {
  const before = studyOn(["2026-09-20", "2026-09-21"]);
  const after = recordActiveDay(before, "2026-09-22");
  assert.equal(after.currentStreak, 3);
  assert.equal(streakXp(before, after, DEFAULT_XP_CONFIG), 5 + 25);
});

test("a streak that restarts after a missed day earns nothing that day", () => {
  const before = studyOn(["2026-09-20", "2026-09-21", "2026-09-22"]);
  const after = recordActiveDay(before, "2026-09-25");
  assert.equal(after.currentStreak, 1);
  assert.equal(streakXp(before, after, DEFAULT_XP_CONFIG), 0);
});

test("stored stats show their level when it adds up", () => {
  assert.deepEqual(
    readXpProgress({ xp: 260, level: 3, xpIntoLevel: 10, xpForNextLevel: 200 }),
    { xp: 260, level: 3, xpIntoLevel: 10, xpForNextLevel: 200 },
  );
});

test("a new student is level 1 on the default curve", () => {
  assert.deepEqual(readXpProgress(undefined), levelForXp(0, DEFAULT_XP_CONFIG));
});

test("stats whose level doesn't add up are placed on the default curve", () => {
  // What the MCQ route wrote before levels were tracked: progress that grew
  // past the size of the level without the level ever moving.
  assert.deepEqual(
    readXpProgress({ xp: 260, level: 1, xpIntoLevel: 260, xpForNextLevel: 100 }),
    levelForXp(260, DEFAULT_XP_CONFIG),
  );
});

test("the admin form round-trips the defaults", () => {
  const parsed = parseXpForm(toXpForm(DEFAULT_XP_CONFIG), LABELS);
  assert.deepEqual(parsed, { config: DEFAULT_XP_CONFIG });
});

test("the admin form lists milestones shortest first", () => {
  const form = toXpForm({
    ...DEFAULT_XP_CONFIG,
    streakMilestones: { "30": 150, "7": 50, "100": 500 },
  });
  assert.deepEqual(
    form.milestones.map((row) => row.days),
    ["7", "30", "100"],
  );
});

test("the admin form rejects amounts that aren't whole numbers", () => {
  const form = toXpForm(DEFAULT_XP_CONFIG);
  for (const bad of ["1.5", "-1", "", "ten", "100001"]) {
    const result = parseXpForm(
      { ...form, amounts: { ...form.amounts, frqSubmission: bad } },
      LABELS,
    );
    assert.ok("error" in result, `expected "${bad}" to be rejected`);
  }
});

test("the admin form rejects a level that costs 0 XP", () => {
  const form = toXpForm(DEFAULT_XP_CONFIG);
  const result = parseXpForm(
    { ...form, amounts: { ...form.amounts, levelBaseXp: "0" } },
    LABELS,
  );
  assert.ok("error" in result);
});

test("the admin form skips blank milestone rows and rejects bad ones", () => {
  const form = toXpForm(DEFAULT_XP_CONFIG);
  const withBlank = parseXpForm(
    { ...form, milestones: [{ days: "7", bonus: "50" }, { days: " ", bonus: "" }] },
    LABELS,
  );
  assert.deepEqual(
    "config" in withBlank && withBlank.config.streakMilestones,
    { "7": 50 },
  );

  for (const milestones of [
    [{ days: "0", bonus: "10" }],
    [{ days: "7", bonus: "0" }],
    [{ days: "7", bonus: "" }],
    [
      { days: "7", bonus: "50" },
      { days: "7", bonus: "60" },
    ],
  ]) {
    assert.ok("error" in parseXpForm({ ...form, milestones }, LABELS));
  }
});
