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

test("older configs default the grade bonus without changing submission XP", () => {
  const config = parseXpConfig({ frqSubmission: 40 });
  assert.equal(config.frqGradeBonus, 25);
  assert.equal(config.frqSubmission, 40);
});

test("the grade bonus is independently configurable, including zero", () => {
  for (const bonus of [0, 60, 100_000]) {
    const config = parseXpConfig({ frqSubmission: 40, frqGradeBonus: bonus });
    assert.equal(config.frqGradeBonus, bonus);
    const parsed = parseXpForm(toXpForm(config), LABELS);
    assert.deepEqual(parsed, { config });
    assert.equal(config.frqSubmission, 40);
  }
});

test("invalid stored grade bonuses fall back and invalid form amounts are rejected", () => {
  for (const bonus of [-1, 1.5, 100_001, "60", null, NaN, Infinity]) {
    const config = parseXpConfig({ frqGradeBonus: bonus });
    assert.equal(config.frqGradeBonus, 25);
  }
  const form = toXpForm(DEFAULT_XP_CONFIG);
  for (const bonus of ["-1", "1.5", "100001", "", "ten"]) {
    const parsed = parseXpForm(
      { ...form, amounts: { ...form.amounts, frqGradeBonus: bonus } },
      LABELS,
    );
    assert.ok("error" in parsed);
  }
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

test("a level curve stored in config/xp is ignored", () => {
  // Configs saved before the curve moved into code still carry these fields.
  assert.deepEqual(
    parseXpConfig({ levelBaseXp: 1000, levelStepXp: 0 }),
    DEFAULT_XP_CONFIG,
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
  assert.deepEqual(levelForXp(0), {
    xp: 0,
    level: 1,
    xpIntoLevel: 0,
    xpForNextLevel: 100,
  });
});

test("each level costs the base plus one more step than the last", () => {
  assert.deepEqual(levelForXp(99), {
    xp: 99,
    level: 1,
    xpIntoLevel: 99,
    xpForNextLevel: 100,
  });
  assert.deepEqual(levelForXp(100), {
    xp: 100,
    level: 2,
    xpIntoLevel: 0,
    xpForNextLevel: 150,
  });
  assert.deepEqual(levelForXp(260), {
    xp: 260,
    level: 3,
    xpIntoLevel: 10,
    xpForNextLevel: 200,
  });
});

test("levels only go up as XP grows", () => {
  let previous = levelForXp(0);
  for (let xp = 1; xp <= 20_000; xp += 7) {
    const current = levelForXp(xp);
    assert.ok(current.level >= previous.level, `level fell at ${xp} XP`);
    previous = current;
  }
});

test("negative or broken totals read as 0 XP", () => {
  assert.equal(levelForXp(-20).xp, 0);
  assert.equal(levelForXp(Number.NaN).xp, 0);
  assert.equal(readXpTotal({ xp: -3 }), 0);
  assert.equal(readXpTotal({ xp: "12" }), 0);
  assert.equal(readXpTotal(undefined), 0);
  assert.equal(readXpTotal({ xp: 42 }), 42);
});

test("the XP to reach a level matches where that total lands", () => {
  for (const level of [1, 2, 3, 10, 50]) {
    const total = totalXpForLevel(level);
    assert.equal(levelForXp(total).level, level);
    assert.equal(levelForXp(total - 1).level, Math.max(1, level - 1));
  }
});

test("adding XP reports a level-up only when one happens", () => {
  assert.deepEqual(addXp(90, 5), {
    xp: 95,
    level: 1,
    xpIntoLevel: 95,
    xpForNextLevel: 100,
    leveledUp: false,
  });
  const leveled = addXp(90, 20);
  assert.equal(leveled.level, 2);
  assert.equal(leveled.xpIntoLevel, 10);
  assert.equal(leveled.leveledUp, true);
});

test("changing the XP settings never moves a student's level down", () => {
  // The #421 regression: with the curve in config/xp, raising the XP for
  // level 2 to 1,000 dropped this student from level 3 to 1 on their next
  // award. Whatever admins save now, earning XP can only keep or raise it.
  assert.equal(levelForXp(305).level, 3);
  const after = addXp(305, 30);
  assert.equal(after.level, 3);
  assert.equal(after.leveledUp, false);
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

test("stored stats show the level their total reaches", () => {
  assert.deepEqual(
    readXpProgress({ xp: 260, level: 3, xpIntoLevel: 10, xpForNextLevel: 200 }),
    { xp: 260, level: 3, xpIntoLevel: 10, xpForNextLevel: 200 },
  );
});

test("a new student is level 1", () => {
  assert.deepEqual(readXpProgress(undefined), levelForXp(0));
});

test("a stored level that doesn't match the total is recomputed", () => {
  // What the MCQ route wrote before levels were tracked: progress that grew
  // past the size of the level without the level ever moving.
  assert.deepEqual(
    readXpProgress({ xp: 260, level: 1, xpIntoLevel: 260, xpForNextLevel: 100 }),
    levelForXp(260),
  );
  // A level written under an admin-edited curve looks self-consistent, but two
  // students with the same XP must still show the same level.
  assert.deepEqual(
    readXpProgress({ xp: 335, level: 1, xpIntoLevel: 335, xpForNextLevel: 1000 }),
    levelForXp(335),
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
