import type { StreakState } from "./streak.ts";

/**
 * Experience points.
 *
 * Every amount of XP lives in one config document, `config/xp`, which admins
 * edit from /admin/xp. Nothing in the activity routes hardcodes a number: a
 * field that is missing or invalid there falls back to its default below, so
 * the site keeps working before anyone has saved the config.
 *
 * XP is only ever awarded by server code, and a student's total, level, and
 * progress into that level are stored together on `userStats/{uid}`.
 */

export interface XpConfig {
  /** Marking a chapter reading complete, once per chapter. */
  readingComplete: number;
  /** Finishing an MCQ test, once per test. */
  mcqTestComplete: number;
  /** Each correct answer on that test, on top of `mcqTestComplete`. */
  mcqCorrectAnswer: number;
  /** Submitting an FRQ, the first time for each FRQ. */
  frqSubmission: number;
  /** The first FRQ or MCQ test of each day that keeps a 2+ day streak going. */
  streakDay: number;
  /** One-off bonuses for reaching a streak length, keyed by days, e.g. "7". */
  streakMilestones: Record<string, number>;
  /** XP needed to go from level 1 to level 2. */
  levelBaseXp: number;
  /** How much more XP each level needs than the one before it. */
  levelStepXp: number;
}

export const XP_CONFIG_COLLECTION = "config";
export const XP_CONFIG_DOC = "xp";

export const DEFAULT_XP_CONFIG: XpConfig = {
  readingComplete: 10,
  mcqTestComplete: 10,
  mcqCorrectAnswer: 10,
  frqSubmission: 25,
  streakDay: 5,
  streakMilestones: { "3": 25, "7": 50, "30": 150, "100": 500 },
  levelBaseXp: 100,
  levelStepXp: 50,
};

/** The scalar fields, in the order the admin form shows them. */
export const XP_AMOUNT_FIELDS = [
  "readingComplete",
  "mcqTestComplete",
  "mcqCorrectAnswer",
  "frqSubmission",
  "streakDay",
  "levelBaseXp",
  "levelStepXp",
] as const satisfies readonly (keyof XpConfig)[];

export type XpAmountField = (typeof XP_AMOUNT_FIELDS)[number];

/** Large enough for any sensible award, small enough to catch a typo. */
export const MAX_XP_AMOUNT = 100_000;

// A loop guard, not a game rule: no student gets anywhere near it.
const MAX_LEVEL = 1_000;

const isAmount = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= 0 &&
  value <= MAX_XP_AMOUNT;

const isStreakLength = (key: string) => /^[1-9]\d{0,4}$/.test(key);

/**
 * The config stored in Firestore, laid over the defaults. Each field is
 * checked on its own, so one bad value falls back without discarding the
 * rest. A level must cost at least 1 XP, or levels would never end.
 */
export function parseXpConfig(data: unknown): XpConfig {
  const stored =
    typeof data === "object" && data !== null
      ? (data as Record<string, unknown>)
      : {};
  const config: XpConfig = {
    ...DEFAULT_XP_CONFIG,
    streakMilestones: { ...DEFAULT_XP_CONFIG.streakMilestones },
  };

  for (const field of XP_AMOUNT_FIELDS) {
    const value = stored[field];
    if (isAmount(value)) config[field] = value;
  }
  if (config.levelBaseXp < 1) config.levelBaseXp = DEFAULT_XP_CONFIG.levelBaseXp;

  const milestones = stored.streakMilestones;
  if (
    typeof milestones === "object" &&
    milestones !== null &&
    !Array.isArray(milestones)
  ) {
    config.streakMilestones = Object.fromEntries(
      Object.entries(milestones).filter(
        ([days, bonus]) => isStreakLength(days) && isAmount(bonus) && bonus > 0,
      ),
    ) as Record<string, number>;
  }

  return config;
}

export type XpForm = {
  amounts: Record<XpAmountField, string>;
  milestones: { days: string; bonus: string }[];
};

/** A config as the admin form shows it: every number as typed text. */
export function toXpForm(config: XpConfig): XpForm {
  return {
    amounts: Object.fromEntries(
      XP_AMOUNT_FIELDS.map((field) => [field, String(config[field])]),
    ) as Record<XpAmountField, string>,
    milestones: Object.entries(config.streakMilestones)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([days, bonus]) => ({ days, bonus: String(bonus) })),
  };
}

/**
 * The admin form's text turned back into a config, or the first problem with
 * it. This is stricter than `parseXpConfig`, which quietly falls back to
 * defaults: an admin should hear that "1.5" isn't a valid amount rather than
 * find out later that it was ignored.
 */
export function parseXpForm(
  form: XpForm,
  labels: Record<XpAmountField, string>,
): { config: XpConfig } | { error: string } {
  const toAmount = (text: string) => {
    const trimmed = text.trim();
    return /^\d+$/.test(trimmed) ? Number(trimmed) : NaN;
  };

  const amounts = {} as Record<XpAmountField, number>;
  for (const field of XP_AMOUNT_FIELDS) {
    const value = toAmount(form.amounts[field]);
    if (!isAmount(value)) {
      return {
        error: `${labels[field]} must be a whole number from 0 to ${MAX_XP_AMOUNT.toLocaleString()}.`,
      };
    }
    amounts[field] = value;
  }
  if (amounts.levelBaseXp < 1) {
    return { error: `${labels.levelBaseXp} must be at least 1.` };
  }

  const streakMilestones: Record<string, number> = {};
  for (const row of form.milestones) {
    const days = row.days.trim();
    if (!days && !row.bonus.trim()) continue;
    if (!isStreakLength(days)) {
      return { error: `"${row.days}" isn't a valid streak length in days.` };
    }
    const bonus = toAmount(row.bonus);
    if (!isAmount(bonus) || bonus < 1) {
      return {
        error: `The ${days}-day milestone bonus must be a whole number from 1 to ${MAX_XP_AMOUNT.toLocaleString()}.`,
      };
    }
    if (days in streakMilestones) {
      return { error: `There are two milestones for ${days} days.` };
    }
    streakMilestones[days] = bonus;
  }

  return { config: { ...amounts, streakMilestones } };
}

/** XP needed to go from `level` to the next one. */
export function xpToAdvance(
  level: number,
  config: Pick<XpConfig, "levelBaseXp" | "levelStepXp">,
): number {
  return config.levelBaseXp + (level - 1) * config.levelStepXp;
}

/** Total XP a student needs to reach `level`. */
export function totalXpForLevel(
  level: number,
  config: Pick<XpConfig, "levelBaseXp" | "levelStepXp">,
): number {
  let total = 0;
  for (let reached = 1; reached < level; reached++) {
    total += xpToAdvance(reached, config);
  }
  return total;
}

export interface XpProgress {
  xp: number;
  level: number;
  /** XP earned since reaching `level`. */
  xpIntoLevel: number;
  /** XP the whole of `level` takes, from reaching it to the next. */
  xpForNextLevel: number;
}

/** Where a total of `xp` lands on the level curve. Everyone starts at level 1. */
export function levelForXp(
  xp: number,
  config: Pick<XpConfig, "levelBaseXp" | "levelStepXp">,
): XpProgress {
  const total = Number.isFinite(xp) ? Math.max(0, Math.floor(xp)) : 0;
  let level = 1;
  let remaining = total;
  let needed = xpToAdvance(level, config);
  while (remaining >= needed && level < MAX_LEVEL) {
    remaining -= needed;
    level += 1;
    needed = xpToAdvance(level, config);
  }
  return { xp: total, level, xpIntoLevel: remaining, xpForNextLevel: needed };
}

/** A student's total XP as stored, with anything unusable read as 0. */
export function readXpTotal(data: Record<string, unknown> | undefined): number {
  const xp = data?.xp;
  return typeof xp === "number" && Number.isFinite(xp) && xp > 0
    ? Math.floor(xp)
    : 0;
}

/**
 * The new total and level after earning `gained` XP. Both sides are placed on
 * the current curve, so a level-up is reported against the config in force
 * now, even if admins have changed the curve since the student's last award.
 */
export function addXp(
  currentXp: number,
  gained: number,
  config: XpConfig,
): XpProgress & { leveledUp: boolean } {
  const before = levelForXp(currentXp, config);
  const after = levelForXp(before.xp + Math.max(0, gained), config);
  return { ...after, leveledUp: after.level > before.level };
}

/**
 * Bonus XP for the streak an activity just extended. Only the first activity
 * of a day can earn it, which is exactly when `recordActiveDay` moves the
 * last active day forward. A streak of 1 is just studying today, so the daily
 * bonus starts on day 2; a milestone pays out each time the streak reaches it.
 */
export function streakXp(
  before: StreakState,
  after: StreakState,
  config: Pick<XpConfig, "streakDay" | "streakMilestones">,
): number {
  if (after.lastActiveDay === before.lastActiveDay) return 0;
  const daily = after.currentStreak >= 2 ? config.streakDay : 0;
  const milestone = config.streakMilestones[String(after.currentStreak)] ?? 0;
  return daily + milestone;
}

/**
 * The level shown for stored stats. The server writes the level alongside the
 * total, so that is used while it is coherent. Stats from before levels were
 * tracked, or none at all for a new student, are placed on the default curve.
 */
export function readXpProgress(
  data: Record<string, unknown> | undefined,
): XpProgress {
  const xp = readXpTotal(data);
  const { level, xpIntoLevel, xpForNextLevel } = data ?? {};
  const isCount = (value: unknown): value is number =>
    typeof value === "number" && Number.isInteger(value) && value >= 0;

  if (
    isCount(level) &&
    level >= 1 &&
    isCount(xpIntoLevel) &&
    isCount(xpForNextLevel) &&
    xpIntoLevel < xpForNextLevel &&
    xpIntoLevel <= xp
  ) {
    return { xp, level, xpIntoLevel, xpForNextLevel };
  }
  return levelForXp(xp, DEFAULT_XP_CONFIG);
}
