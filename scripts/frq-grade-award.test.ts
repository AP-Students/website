import assert from "node:assert/strict";
import { test } from "node:test";
import type { Firestore } from "firebase-admin/firestore";
import {
  awardFrqGrade,
  FrqGradeAwardError,
  gradeXpForScore,
} from "../src/lib/server/awardFrqGrade.ts";

type Data = Record<string, unknown>;
type Ref = { path: string };
type Snapshot = { exists: boolean; data: () => Data | undefined };
type Transaction = {
  getAll: (...refs: Ref[]) => Promise<Snapshot[]>;
  set: (ref: Ref, data: Data, options?: { merge: boolean }) => void;
};

/** Optimistic read-version checks emulate Firestore's transaction retries. */
class MemoryDb {
  docs = new Map<string, Data>();
  versions = new Map<string, number>();
  writes: string[] = [];
  retries = 0;

  doc(path: string): Ref {
    return { path };
  }
  collection(path: string) {
    return { doc: (id: string) => this.doc(`${path}/${id}`) };
  }
  put(path: string, data: Data) {
    this.docs.set(path, data);
    this.versions.set(path, (this.versions.get(path) ?? 0) + 1);
  }

  async runTransaction<T>(
    callback: (transaction: Transaction) => Promise<T>,
  ): Promise<T> {
    for (;;) {
      const reads = new Map<string, number>();
      const pending: { ref: Ref; data: Data; merge?: boolean }[] = [];
      const transaction: Transaction = {
        getAll: async (...refs) =>
          refs.map((ref) => {
            reads.set(ref.path, this.versions.get(ref.path) ?? 0);
            const data = this.docs.get(ref.path);
            return { exists: data !== undefined, data: () => data };
          }),
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
const receiptPath = "xpAwards/frq_grade_attempt";
const statsPath = "userStats/student";
const grade: Data = {
  studentId: "student",
  graderId: "staff",
  sourceSubmissionId: "attempt",
  subject: "physics",
  unitId: "unit",
  templateId: "template",
  score: "4/6",
};
function fixture(role = "grader") {
  const db = new MemoryDb();
  db.put("users/staff", { access: role });
  db.put(resultPath, grade);
  db.put(statsPath, {
    xp: 90,
    currentStreak: 4,
    lastActiveDay: "2026-10-01",
    frqsSubmitted: 1,
  });
  return db;
}
const award = (db: MemoryDb, bonus = 25) =>
  awardFrqGrade(db as unknown as Firestore, "staff", "attempt", {
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
  assert.deepEqual(db.writes.sort(), [statsPath, receiptPath].sort());
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

void test("uses configured bonus and saved score, including a disabled bonus", async () => {
  assert.equal((await award(fixture(), 60)).xpAwarded, 40);
  const db = fixture();
  assert.equal((await award(db, 0)).xpAwarded, 0);
  assert.deepEqual(db.writes, []);
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
