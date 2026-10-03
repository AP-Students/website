import assert from "node:assert/strict";
import { test } from "node:test";
import type {
  DocumentReference,
  Firestore,
  Transaction,
} from "firebase-admin/firestore";
import {
  completedTestKey,
  prepareTestCompletion,
  requiredSubjectTests,
  type TestIdentity,
} from "../src/lib/server/testCompletion.ts";

type Data = Record<string, unknown>;
type Ref = { path: string; id: string; field?: string; value?: unknown };

/** Optimistic transaction fixture, including collection-query version checks. */
class CompletionDb {
  docs = new Map<string, Data>();
  versions = new Map<string, number>();
  writes: string[] = [];
  retries = 0;
  doc(path: string): Ref {
    return { path, id: path.split("/").at(-1)! };
  }
  collection(path: string) {
    return {
      where: (field: string, _operator: string, value: unknown) => ({
        ...this.doc(path),
        field,
        value,
      }),
    };
  }
  put(path: string, data: Data) {
    this.docs.set(path, data);
    for (const key of [path, `query:${path.slice(0, path.lastIndexOf("/"))}`]) {
      this.versions.set(key, (this.versions.get(key) ?? 0) + 1);
    }
  }
  snapshot(path: string) {
    const data = this.docs.get(path);
    return {
      id: this.doc(path).id,
      exists: data !== undefined,
      data: () => data,
    };
  }
  async run<T>(callback: (transaction: Transaction) => Promise<T>): Promise<T> {
    for (;;) {
      const reads = new Map<string, number>();
      const pending: { path: string; data: Data; merge?: boolean }[] = [];
      const read = (ref: Ref) => {
        const key = ref.field ? `query:${ref.path}` : ref.path;
        reads.set(key, this.versions.get(key) ?? 0);
        return ref.field
          ? {
              docs: [...this.docs]
                .filter(
                  ([path, data]) =>
                    path.slice(0, path.lastIndexOf("/")) === ref.path &&
                    data[ref.field!] === ref.value,
                )
                .map(([path]) => this.snapshot(path)),
            }
          : this.snapshot(ref.path);
      };
      const transaction = {
        get: async (ref: Ref) => read(ref),
        getAll: async (...refs: Ref[]) => refs.map(read),
        create: (ref: Ref, data: Data) => {
          pending.push({ path: ref.path, data });
        },
        set: (ref: Ref, data: Data, options?: { merge: boolean }) => {
          pending.push({ path: ref.path, data, merge: options?.merge });
        },
      } as unknown as Transaction;
      const result = await callback(transaction);
      if (
        [...reads].some(
          ([key, version]) => version !== (this.versions.get(key) ?? 0),
        )
      ) {
        this.retries++;
        continue;
      }
      for (const item of pending) {
        this.put(item.path, {
          ...(item.merge ? this.docs.get(item.path) : {}),
          ...item.data,
        });
        this.writes.push(item.path);
      }
      return result;
    }
  }
}

const identity = (
  testId: string,
  subject = "physics",
  unitId = "unit",
): TestIdentity => ({ subject, unitId, testId });
function fixture(testIds = ["a", "b"]) {
  const db = new CompletionDb();
  db.put("subjects/physics", { units: [{ id: "unit" }] });
  testIds.forEach((id) =>
    db.put(`subjects/physics/units/unit/tests/${id}`, { isPublic: true }),
  );
  db.put("userStats/student", {
    subjectsCompleted: 0,
    mcqTestsCompleted: 0,
    xp: 50,
    currentStreak: 3,
  });
  return db;
}
const complete = (db: CompletionDb, current: TestIdentity) =>
  db.run(async (transaction) => {
    const statsRef = db.doc("userStats/student");
    const stats = await transaction.get(
      statsRef as unknown as DocumentReference,
    );
    const plan = await prepareTestCompletion(
      transaction,
      db as unknown as Firestore,
      "student",
      current,
    );
    plan.write();
    if (!plan.alreadyCompleted || plan.subjectCompleted)
      transaction.set(
        statsRef as unknown as DocumentReference,
        {
          mcqTestsCompleted:
            Number(stats.data()?.mcqTestsCompleted ?? 0) +
            (plan.alreadyCompleted ? 0 : 1),
          subjectsCompleted:
            Number(stats.data()?.subjectsCompleted ?? 0) +
            (plan.subjectCompleted ? 1 : 0),
        },
        { merge: true },
      );
    return {
      testAdded: !plan.alreadyCompleted,
      subjectAdded: plan.subjectCompleted,
    };
  });

void test("first completion records a stable test once; retakes do nothing", async () => {
  const db = fixture();
  assert.deepEqual(await complete(db, identity("a")), {
    testAdded: true,
    subjectAdded: false,
  });
  const writes = db.writes.length;
  assert.deepEqual(await complete(db, identity("a")), {
    testAdded: false,
    subjectAdded: false,
  });
  assert.equal(db.writes.length, writes);
  assert.equal(db.docs.get("userStats/student")?.mcqTestsCompleted, 1);
  assert.equal(
    db.docs.has(
      `users/student/completedTests/${completedTestKey(identity("a"))}`,
    ),
    true,
  );
});

void test("the final required test completes a subject once", async () => {
  const db = fixture();
  await complete(db, identity("a"));
  assert.equal((await complete(db, identity("b"))).subjectAdded, true);
  assert.equal(db.docs.get("userStats/student")?.subjectsCompleted, 1);
  assert.equal((await complete(db, identity("b"))).subjectAdded, false);
  assert.equal(db.docs.get("userStats/student")?.subjectsCompleted, 1);
  assert.equal(db.docs.get("userStats/student")?.xp, 50);
  assert.equal(db.docs.get("userStats/student")?.currentStreak, 3);
  assert.equal(
    db.writes.some((path) => path.startsWith("activityCalendar/")),
    false,
  );
});

void test("concurrent different tests and duplicate final tests count exactly once", async () => {
  const db = fixture();
  const results = await Promise.all([
    complete(db, identity("a")),
    complete(db, identity("b")),
    complete(db, identity("b")),
  ]);
  assert.equal(results.filter((item) => item.testAdded).length, 2);
  assert.equal(results.filter((item) => item.subjectAdded).length, 1);
  assert.equal(db.docs.get("userStats/student")?.mcqTestsCompleted, 2);
  assert.equal(db.docs.get("userStats/student")?.subjectsCompleted, 1);
  assert.ok(db.retries > 0);
});

void test("required tests span current units, exclude private tests and orphan units", async () => {
  const db = fixture(["a"]);
  db.put("subjects/physics", {
    units: [{ id: "unit" }, { id: "second" }, { id: "second" }],
  });
  db.put("subjects/physics/units/unit/tests/private", { isPublic: false });
  db.put("subjects/physics/units/second/tests/b", { isPublic: true });
  db.put("subjects/physics/units/orphan/tests/c", { isPublic: true });
  const required = await db.run((transaction) =>
    requiredSubjectTests(transaction, db as unknown as Firestore, "physics"),
  );
  assert.deepEqual(required.map((item) => item.testId).sort(), ["a", "b"]);
  assert.equal((await complete(db, identity("a"))).subjectAdded, false);
  assert.equal(
    (await complete(db, identity("b", "physics", "second"))).subjectAdded,
    true,
  );
});

void test("legacy activity evidence is backfilled without recounting prior tests", async () => {
  const db = fixture();
  db.put("userStats/student", { subjectsCompleted: 0, mcqTestsCompleted: 1 });
  db.put("activityEvents/student_mcq_test_a", {
    userId: "student",
    type: "mcq_test",
    subject: "physics",
    unitId: "unit",
    sourceId: "a",
  });
  assert.equal((await complete(db, identity("b"))).subjectAdded, true);
  assert.equal(db.docs.get("userStats/student")?.mcqTestsCompleted, 2);
  assert.equal(
    db.docs.has(
      `users/student/completedTests/${completedTestKey(identity("a"))}`,
    ),
    true,
  );
});

void test("a subject remains completed if more tests are later published", async () => {
  const db = fixture(["a"]);
  await complete(db, identity("a"));
  db.put("subjects/physics/units/unit/tests/b", { isPublic: true });
  assert.equal((await complete(db, identity("b"))).subjectAdded, false);
  assert.equal(db.docs.get("userStats/student")?.subjectsCompleted, 1);
});

void test("empty curricula never auto-complete and identities are collision-free", async () => {
  const db = fixture([]);
  assert.equal((await complete(db, identity("a"))).subjectAdded, false);
  assert.notEqual(
    completedTestKey(identity("a", "physics")),
    completedTestKey(identity("a", "biology")),
  );
  assert.notEqual(
    completedTestKey(identity("a", "physics", "unit")),
    completedTestKey(identity("a", "physics", "other")),
  );
  assert.notEqual(
    completedTestKey(identity("x:y", "physics", "z")),
    completedTestKey(identity("y", "physics", "z:x")),
  );
});
