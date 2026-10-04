import assert from "node:assert/strict";
import { test } from "node:test";
import {
  Timestamp,
  type Firestore,
  type Transaction as AdminTransaction,
} from "firebase-admin/firestore";
import { awardAchievements } from "../src/lib/server/awardAchievements.ts";
import {
  checkAchievements,
  readAchievementStats,
} from "../src/lib/achievements/checkAchievements.ts";
import {
  awardFrqGrade,
  FrqGradeAwardError,
  gradeXpForScore,
} from "../src/lib/server/awardFrqGrade.ts";

type Data = Record<string, unknown>;
type Ref = { path: string; id: string; field?: string; value?: unknown };
type Snapshot = { exists: boolean; data: () => Data | undefined };
type Transaction = {
  get: (ref: Ref) => Promise<Snapshot>;
  getAll: (...refs: Ref[]) => Promise<Snapshot[]>;
  create: (ref: Ref, data: Data) => void;
  set: (ref: Ref, data: Data, options?: { merge: boolean }) => void;
};

/** Optimistic read-version checks emulate Firestore's transaction retries. */
class MemoryDb {
  docs = new Map<string, Data>();
  versions = new Map<string, number>();
  writes: string[] = [];
  retries = 0;

  doc(path: string): Ref {
    return { path, id: path.split("/").at(-1)! };
  }
  collection(path: string) {
    return {
      doc: (id: string) => this.doc(`${path}/${id}`),
      where: (field: string, _operator: string, value: unknown) => ({
        ...this.doc(path),
        field,
        value,
      }),
    };
  }
  put(path: string, data: Data) {
    this.docs.set(path, data);
    this.versions.set(path, (this.versions.get(path) ?? 0) + 1);
    const collectionKey = `query:${path.slice(0, path.lastIndexOf("/"))}`;
    this.versions.set(
      collectionKey,
      (this.versions.get(collectionKey) ?? 0) + 1,
    );
  }

  async runTransaction<T>(
    callback: (transaction: Transaction) => Promise<T>,
  ): Promise<T> {
    for (;;) {
      const reads = new Map<string, number>();
      const pending: { ref: Ref; data: Data; merge?: boolean }[] = [];
      const transaction: Transaction = {
        get: async (ref) => {
          assert.equal(
            pending.length,
            0,
            "Firestore requires reads before writes",
          );
          if (ref.field) {
            reads.set(
              `query:${ref.path}`,
              this.versions.get(`query:${ref.path}`) ?? 0,
            );
            return {
              exists: false,
              data: () => undefined,
              docs: [...this.docs]
                .filter(
                  ([path, data]) =>
                    path.slice(0, path.lastIndexOf("/")) === ref.path &&
                    data[ref.field!] === ref.value,
                )
                .map(([path, data]) => ({
                  id: this.doc(path).id,
                  data: () => data,
                })),
            };
          }
          reads.set(ref.path, this.versions.get(ref.path) ?? 0);
          const data = this.docs.get(ref.path);
          return { exists: data !== undefined, data: () => data };
        },
        create: (ref, data) => {
          pending.push({ ref, data });
        },
        getAll: async (...refs) => {
          assert.equal(
            pending.length,
            0,
            "Firestore requires reads before writes",
          );
          return refs.map((ref) => {
            reads.set(ref.path, this.versions.get(ref.path) ?? 0);
            const data = this.docs.get(ref.path);
            return { exists: data !== undefined, data: () => data };
          });
        },
        set: (ref, data, options) => {
          pending.push({ ref, data, merge: options?.merge });
        },
      };
      const result = await callback(transaction);
      if (
        [...reads].some(
          ([path, version]) => version !== (this.versions.get(path) ?? 0),
        )
      ) {
        this.retries++;
        continue;
      }
      for (const { ref, data, merge } of pending) {
        this.put(ref.path, {
          ...(merge ? this.docs.get(ref.path) : {}),
          ...data,
        });
        this.writes.push(ref.path);
      }
      return result;
    }
  }
}

const resultPath = "graded-frqs/attempt";
const receiptPath = "xpAwards/student_frq_grade_template";
const notificationReceiptPath = "xpAwards/frq_grade_attempt";
const statsPath = "userStats/student";
const notificationPath = "notifications/student/items/frq_graded_attempt";
const grade: Data = {
  studentId: "student",
  graderId: "staff",
  sourceSubmissionId: "attempt",
  subject: "physics",
  unitId: "unit",
  templateId: "template",
  score: "4/6",
  gradedAt: Timestamp.fromMillis(1_000),
};
function fixture(role = "grader") {
  const db = new MemoryDb();
  db.put("users/staff", { access: role });
  db.put(resultPath, grade);
  // The submission already earned its achievement before grading.
  db.put("users/student/achievements/frq-1", { id: "frq-1" });
  db.put(statsPath, {
    xp: 90,
    currentStreak: 4,
    lastActiveDay: "2026-10-01",
    frqsSubmitted: 1,
  });
  return db;
}
const award = (db: MemoryDb, bonus = 25, submissionId = "attempt") =>
  awardFrqGrade(db as unknown as Firestore, "staff", submissionId, {
    frqGradeBonus: bonus,
  });

void test("only authoritative staff roles can award XP", async () => {
  for (const role of ["user", "banned", "unknown"]) {
    const db = fixture(role);
    await assert.rejects(
      award(db),
      (error: unknown) =>
        error instanceof FrqGradeAwardError && error.status === 403,
    );
    assert.deepEqual(db.writes, []);
  }
  const missing = fixture();
  missing.docs.delete("users/staff");
  await assert.rejects(award(missing), /Staff access required/);
  for (const role of ["admin", "member", "grader"]) {
    assert.equal((await award(fixture(role))).xpAwarded, 17);
  }
});

void test("pays the student, updates levels, and leaves streak/calendar untouched", async () => {
  const db = fixture();
  const result = await award(db);
  assert.equal(result.xpAwarded, 17);
  assert.equal(result.totalXp, 107);
  assert.equal(result.level, 2);
  assert.equal(result.leveledUp, true);
  assert.equal(db.docs.get(statsPath)?.currentStreak, 4);
  assert.equal(db.docs.get(statsPath)?.lastActiveDay, "2026-10-01");
  assert.equal(db.docs.get(statsPath)?.frqsSubmitted, 1);
  assert.deepEqual(
    db.writes.sort(),
    [statsPath, receiptPath, notificationPath, notificationReceiptPath].sort(),
  );
  assert.equal(db.docs.has("userStats/staff"), false);
  assert.equal(db.docs.get(receiptPath)?.xpAwarded, 17);
});

void test("replays and concurrent requests cannot double pay", async () => {
  const db = fixture();
  const results = await Promise.all([award(db), award(db)]);
  assert.equal(
    results.reduce((sum, result) => sum + result.xpAwarded, 0),
    17,
  );
  assert.equal(db.docs.get(statsPath)?.xp, 107);
  assert.ok(db.retries > 0);
  assert.equal((await award(db)).alreadyRecorded, true);
  assert.equal(db.docs.get(statsPath)?.xp, 107);
});

void test("regrades pay only the positive difference and never lower the high-water mark", async () => {
  const db = fixture();
  await award(db);
  db.put(resultPath, { ...grade, score: "6/6" });
  const results = await Promise.all([award(db), award(db)]);
  assert.equal(
    results.reduce((sum, result) => sum + result.xpAwarded, 0),
    8,
  );
  db.put(resultPath, { ...grade, score: "1/6" });
  assert.equal((await award(db)).xpAwarded, 0);
  db.put(resultPath, { ...grade, score: "5/6" });
  assert.equal((await award(db)).xpAwarded, 0);
  assert.equal(db.docs.get(statsPath)?.xp, 115);
  assert.equal(db.docs.get(receiptPath)?.xpAwarded, 25);
});

void test("retakes share the FRQ balance: 17, then +8, then zero for every full-score retry or attempt", async () => {
  const db = fixture();
  assert.equal((await award(db)).xpAwarded, 17);
  db.put("graded-frqs/retake", {
    ...grade,
    sourceSubmissionId: "retake",
    score: "6/6",
  });
  assert.equal((await award(db, 25, "retake")).xpAwarded, 8);
  assert.equal((await award(db, 25, "retake")).xpAwarded, 0);
  db.put(resultPath, { ...grade, score: "6/6" });
  assert.equal((await award(db)).xpAwarded, 0);
  db.put("graded-frqs/third", {
    ...grade,
    sourceSubmissionId: "third",
    score: "6/6",
  });
  assert.equal((await award(db, 25, "third")).xpAwarded, 0);
  assert.equal(db.docs.get(receiptPath)?.xpAwarded, 25);
  assert.equal(db.docs.get(receiptPath)?.sourceId, "template");
  assert.equal(db.docs.get(statsPath)?.xp, 115);
  // Separate attempts still get their grading notifications, without fresh XP.
  assert.ok(db.docs.has("notifications/student/items/frq_graded_retake"));
  assert.ok(db.docs.has("notifications/student/items/frq_graded_third"));
  assert.equal(db.docs.get("xpAwards/frq_grade_retake")?.xpAwarded, undefined);
});

void test("concurrent different attempts and retries cannot exceed one FRQ entitlement", async () => {
  const db = fixture();
  db.put("graded-frqs/retake", {
    ...grade,
    sourceSubmissionId: "retake",
    score: "6/6",
  });
  const results = await Promise.all([
    award(db),
    award(db, 25, "retake"),
    award(db),
    award(db, 25, "retake"),
  ]);
  assert.equal(
    results.reduce((sum, result) => sum + result.xpAwarded, 0),
    25,
  );
  assert.equal(db.docs.get(receiptPath)?.xpAwarded, 25);
  assert.equal(db.docs.get(statsPath)?.xp, 115);
  assert.ok(db.retries > 0);
});

void test("concurrent retakes pay only the remaining FRQ difference", async () => {
  const db = fixture();
  await award(db);
  for (const id of ["retake-a", "retake-b"]) {
    db.put(`graded-frqs/${id}`, {
      ...grade,
      sourceSubmissionId: id,
      score: "6/6",
    });
  }
  const results = await Promise.all([
    award(db, 25, "retake-a"),
    award(db, 25, "retake-b"),
  ]);
  assert.equal(
    results.reduce((sum, result) => sum + result.xpAwarded, 0),
    8,
  );
  assert.equal(db.docs.get(receiptPath)?.xpAwarded, 25);
});

void test("different students and FRQs retain independent entitlements", async () => {
  const db = fixture();
  await award(db);
  db.put("graded-frqs/other-student", {
    ...grade,
    studentId: "other",
    sourceSubmissionId: "other-student",
    score: "6/6",
  });
  db.put("graded-frqs/other-frq", {
    ...grade,
    templateId: "other-template",
    sourceSubmissionId: "other-frq",
    score: "6/6",
  });
  assert.equal((await award(db, 25, "other-student")).xpAwarded, 25);
  assert.equal((await award(db, 25, "other-frq")).xpAwarded, 25);
  assert.equal(db.docs.get("xpAwards/other_frq_grade_template")?.xpAwarded, 25);
  assert.equal(
    db.docs.get("xpAwards/student_frq_grade_other-template")?.xpAwarded,
    25,
  );
  assert.equal(db.docs.get(receiptPath)?.xpAwarded, 17);
});

void test("legacy attempt payouts migrate cumulatively without paying them again or recreating expired notifications", async () => {
  const db = fixture();
  db.put(resultPath, { ...grade, score: "6/6" });
  const legacy = {
    userId: "student",
    type: "frq_grade",
    subject: "physics",
    unitId: "unit",
    templateId: "template",
    notificationCreated: true,
  };
  db.put(notificationReceiptPath, { ...legacy, xpAwarded: 17 });
  db.put("xpAwards/frq_grade_old-retake", { ...legacy, xpAwarded: 8 });
  db.put(statsPath, { ...db.docs.get(statsPath), xp: 115 });
  const results = await Promise.all([award(db), award(db)]);
  assert.equal(
    results.reduce((sum, result) => sum + result.xpAwarded, 0),
    0,
  );
  assert.equal(db.docs.get(receiptPath)?.xpAwarded, 25);
  assert.equal(db.docs.get(statsPath)?.xp, 115);
  assert.equal(db.docs.has(notificationPath), false);
  assert.equal(db.docs.get(notificationReceiptPath)?.xpAwarded, 17);
});

void test("legacy partial payout pays only the positive difference on a new attempt", async () => {
  const db = fixture();
  db.put("xpAwards/frq_grade_old", {
    userId: "student",
    type: "frq_grade",
    subject: "physics",
    unitId: "unit",
    templateId: "template",
    xpAwarded: 17,
  });
  db.put(resultPath, { ...grade, score: "6/6" });
  db.put(statsPath, { ...db.docs.get(statsPath), xp: 107 });
  assert.equal((await award(db)).xpAwarded, 8);
  assert.equal(db.docs.get(receiptPath)?.xpAwarded, 25);
  assert.equal(db.docs.get(statsPath)?.xp, 115);
});

void test("legacy overpayments are retained and prevent any fresh grade payout", async () => {
  const db = fixture();
  for (const id of ["old-a", "old-b"])
    db.put(`xpAwards/frq_grade_${id}`, {
      userId: "student",
      type: "frq_grade",
      subject: "physics",
      unitId: "unit",
      templateId: "template",
      xpAwarded: 25,
    });
  db.put(resultPath, { ...grade, score: "6/6" });
  db.put(statsPath, { ...db.docs.get(statsPath), xp: 140 });
  assert.equal((await award(db)).xpAwarded, 0);
  assert.equal(db.docs.get(receiptPath)?.xpAwarded, 50);
  assert.equal(db.docs.get(statsPath)?.xp, 140);
});

void test("uses configured bonus and saved score, including a disabled bonus", async () => {
  assert.equal((await award(fixture(), 60)).xpAwarded, 40);
  const db = fixture();
  assert.equal((await award(db, 0)).xpAwarded, 0);
  assert.deepEqual(
    db.writes.sort(),
    [receiptPath, notificationPath, notificationReceiptPath].sort(),
  );
});

void test("full, partial, and zero scores use a non-default configured maximum", async () => {
  for (const [score, expected] of [
    ["6/6", 73],
    ["3/6", 37],
    ["0/6", 0],
  ] as const) {
    const db = fixture();
    db.put(resultPath, { ...grade, score });
    assert.equal((await award(db, 73)).xpAwarded, expected);
    assert.equal(db.docs.get(statsPath)?.xp, 90 + expected);
    assert.equal(db.docs.get(receiptPath)?.gradeBonus, 73);
  }
});

void test("both self-grade collections and an official self-grade earn zero", async () => {
  const db = fixture();
  db.docs.delete(resultPath);
  db.put("self-graded-frqs/attempt", { ...grade, graderId: "student" });
  assert.equal((await award(db)).xpAwarded, 0);
  assert.deepEqual(db.writes, []);
  db.put(resultPath, { ...grade, graderId: "student" });
  assert.equal((await award(db)).xpAwarded, 0);
  assert.deepEqual(db.writes, []);
});

void test("malformed grades and inconsistent receipts fail without paying", async () => {
  for (const score of ["oops", "4/0", "4/-6", "Infinity/6", null]) {
    const db = fixture();
    db.put(resultPath, { ...grade, score });
    await assert.rejects(award(db), /valid score/);
    assert.deepEqual(db.writes, []);
  }
  const db = fixture();
  await award(db);
  db.put(resultPath, { ...grade, studentId: "someone-else" });
  await assert.rejects(award(db), /receipt is inconsistent/);
  assert.equal(db.docs.has("userStats/someone-else"), false);
  db.docs.delete(resultPath);
  await assert.rejects(award(db), /Saved grade not found/);
});

void test("concurrent grade edits retry with the latest saved score", async () => {
  const db = fixture();
  const payout = award(db);
  db.put(resultPath, { ...grade, score: "6/6" });
  assert.equal((await payout).xpAwarded, 25);
  assert.ok(db.retries > 0);
});

void test("revoked staff access during a transaction prevents payment", async () => {
  const db = fixture();
  const payout = award(db);
  db.put("users/staff", { access: "user" });
  await assert.rejects(payout, /Staff access required/);
  assert.deepEqual(db.writes, []);
});

void test("proportional score rounding and clamping", () => {
  assert.equal(gradeXpForScore("4/6", 25), 17);
  assert.equal(gradeXpForScore("100/6", 25), 25);
  assert.equal(gradeXpForScore("-1/6", 25), 0);
  assert.equal(gradeXpForScore("0/6", 25), 0);
  assert.equal(gradeXpForScore("1.5/3", 25), 13);
});

void test("notification uses trusted grade content and is created once under concurrency", async () => {
  const db = fixture();
  await Promise.all([award(db), award(db)]);
  const notification = db.docs.get(notificationPath)!;
  assert.equal(notification.id, "frq_graded_attempt");
  assert.equal(notification.type, "frq_graded");
  assert.equal(notification.href, "/frq-feedback/attempt");
  assert.match(notification.body as string, /4\/6/);
  assert.equal(notification.readAt, null);
  assert.equal(notification.expiresAt, null);
  assert.ok(notification.createdAt);
  assert.equal(db.writes.filter((path) => path === notificationPath).length, 1);
  db.put(notificationPath, {
    ...notification,
    readAt: Timestamp.fromMillis(2_000),
  });
  db.put(resultPath, { ...grade, score: "6/6" });
  assert.equal((await award(db)).xpAwarded, 8);
  assert.equal(
    (db.docs.get(notificationPath)?.readAt as Timestamp).toMillis(),
    2_000,
  );
  assert.equal(db.writes.filter((path) => path === notificationPath).length, 1);
});

void test("expired/deleted notifications cannot be recreated by retries", async () => {
  const db = fixture();
  await award(db);
  db.docs.delete(notificationPath);
  await award(db);
  assert.equal(db.docs.has(notificationPath), false);
  db.put(resultPath, { ...grade, score: "6/6" });
  assert.equal((await award(db)).xpAwarded, 8);
  assert.equal(db.docs.has(notificationPath), false);
});

void test("zero scores notify without updating XP or streak", async () => {
  const db = fixture();
  db.put(resultPath, { ...grade, score: "0/6" });
  await award(db);
  assert.equal(db.docs.get(statsPath)?.xp, 90);
  assert.equal(db.docs.get(receiptPath)?.xpAwarded, 0);
  assert.ok(db.docs.has(notificationPath));
  assert.equal(db.writes.includes(statsPath), false);
});

void test("grades without a valid saved grading timestamp cannot notify", async () => {
  const db = fixture();
  db.put(resultPath, { ...grade, gradedAt: null });
  await assert.rejects(award(db), /grading timestamp/);
  assert.deepEqual(db.writes, []);
});

void test("a corrupt payout amount cannot reset a prior award", async () => {
  for (const amount of [undefined, null, -1, 1.5, "17", NaN]) {
    const db = fixture();
    db.put(receiptPath, {
      userId: "student",
      subject: "physics",
      unitId: "unit",
      templateId: "template",
      xpAwarded: amount,
    });
    await assert.rejects(award(db), /receipt is inconsistent/);
    assert.deepEqual(db.writes, []);
  }
});

const awardBadges = (db: MemoryDb, stats: Data) =>
  db.runTransaction((transaction) =>
    awardAchievements(
      transaction as unknown as AdminTransaction,
      db as unknown as Firestore,
      "student",
      stats,
    ),
  );

void test("pure achievement checks and ineligible stats never create notifications", async () => {
  const db = new MemoryDb();
  assert.equal(
    checkAchievements(readAchievementStats({ frqsSubmitted: 1 }), new Set())
      .length,
    1,
  );
  assert.deepEqual(db.writes, []);
  assert.deepEqual(await awardBadges(db, {}), []);
  assert.deepEqual(db.writes, []);
});

void test("new achievements and their notifications commit together once under concurrency", async () => {
  const db = new MemoryDb();
  const results = await Promise.all([
    awardBadges(db, { frqsSubmitted: 1 }),
    awardBadges(db, { frqsSubmitted: 1 }),
  ]);
  assert.deepEqual(results.flat(), ["frq-1"]);
  assert.ok(db.docs.get("users/student/achievements/frq-1")?.earnedAt);
  const notification = db.docs.get(
    "notifications/student/items/achievement_frq-1",
  )!;
  assert.equal(notification.title, "Free Thinker");
  assert.equal(notification.type, "achievement");
  assert.equal(notification.href, "/dashboard#achievements");
  assert.equal(notification.expiresAt, null);
  assert.equal(db.writes.length, 2);
  assert.ok(db.retries > 0);
  assert.deepEqual(await awardBadges(db, { frqsSubmitted: 1 }), []);
  assert.equal(db.writes.length, 2);
});

void test("earned achievements never re-notify even after notification deletion", async () => {
  const db = new MemoryDb();
  await awardBadges(db, { frqsSubmitted: 1 });
  db.docs.delete("notifications/student/items/achievement_frq-1");
  assert.deepEqual(await awardBadges(db, { frqsSubmitted: 1 }), []);
  assert.equal(
    db.docs.has("notifications/student/items/achievement_frq-1"),
    false,
  );
  assert.equal(db.writes.length, 2);
});

void test("previously earned achievements are not backfilled with notifications", async () => {
  const db = fixture();
  assert.deepEqual(await awardBadges(db, { frqsSubmitted: 1 }), []);
  assert.deepEqual(db.writes, []);
});

void test("new thresholds award only the newly earned achievement", async () => {
  const db = new MemoryDb();
  await awardBadges(db, { frqsSubmitted: 1 });
  assert.deepEqual(await awardBadges(db, { frqsSubmitted: 10 }), ["frq-10"]);
  assert.deepEqual(await awardBadges(db, { frqsSubmitted: 10 }), []);
  assert.equal(db.writes.length, 4);
});

void test("FRQ grade XP can unlock a level achievement for the student", async () => {
  const db = fixture();
  db.put(statsPath, { xp: 699, level: 4, frqsSubmitted: 1, currentStreak: 4 });
  const result = await award(db);
  assert.deepEqual(result.newlyUnlocked, ["level-5"]);
  assert.ok(db.docs.has("users/student/achievements/level-5"));
  assert.ok(db.docs.has("notifications/student/items/achievement_level-5"));
  assert.equal(db.docs.get(statsPath)?.currentStreak, 4);
  assert.equal((await award(db)).newlyUnlocked.length, 0);
});
