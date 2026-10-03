import {
  FieldValue,
  Timestamp,
  type Firestore,
  type Transaction,
} from "firebase-admin/firestore";
import { dashboardDocumentPaths } from "../../types/dashboard.ts";

export interface TestIdentity {
  subject: string;
  unitId: string;
  testId: string;
}

/** Full curriculum identity prevents collisions between units or subjects. */
export const completedTestKey = (test: TestIdentity) =>
  encodeURIComponent(JSON.stringify([test.subject, test.unitId, test.testId]));

const validId = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && !value.includes("/");

/** Published MCQ test documents in the subject's current units are required. */
export async function requiredSubjectTests(
  transaction: Transaction,
  db: Firestore,
  subject: string,
): Promise<TestIdentity[]> {
  const curriculum = await transaction.get(db.doc(`subjects/${subject}`));
  const units: unknown = curriculum.data()?.units;
  const unitIds = new Set(
    Array.isArray(units)
      ? units.flatMap((unit: unknown) => {
          const id: unknown =
            typeof unit === "object" && unit !== null && "id" in unit
              ? unit.id
              : undefined;
          return validId(id) ? [id] : [];
        })
      : [],
  );
  const tests: TestIdentity[] = [];
  for (const unitId of unitIds) {
    const published = await transaction.get(
      db
        .collection(`subjects/${subject}/units/${unitId}/tests`)
        .where("isPublic", "==", true),
    );
    published.docs.forEach((test) =>
      tests.push({ subject, unitId, testId: test.id }),
    );
  }
  return tests;
}

/**
 * Reads the completion state before any writes. Call write() only after other
 * transaction readers (such as achievement awarding) have finished.
 */
export async function prepareTestCompletion(
  transaction: Transaction,
  db: Firestore,
  uid: string,
  current: TestIdentity,
) {
  const required = await requiredSubjectTests(transaction, db, current.subject);
  const all = new Map(required.map((test) => [completedTestKey(test), test]));
  const currentKey = completedTestKey(current);
  all.set(currentKey, current);
  const tests = [...all.values()];
  const subjectRef = db.doc(
    dashboardDocumentPaths.completedSubject(uid, current.subject),
  );
  const subjectSnapshot = await transaction.get(subjectRef);
  const refs = tests.map((test) => ({
    completed: db.doc(
      dashboardDocumentPaths.completedTest(uid, completedTestKey(test)),
    ),
    legacy: db.doc(
      dashboardDocumentPaths.activity(`${uid}_mcq_test_${test.testId}`),
    ),
  }));
  const snapshots = await transaction.getAll(
    ...refs.flatMap((ref) => [ref.completed, ref.legacy]),
  );
  const completed = new Set<string>();
  const backfill: { index: number; completedAt: Timestamp | FieldValue }[] = [];
  let alreadyCompleted = false;
  tests.forEach((test, index) => {
    const legacy: Record<string, unknown> | undefined =
      snapshots[index * 2 + 1]?.data();
    const recordExists = snapshots[index * 2]?.exists ?? false;
    const legacyMatches =
      legacy?.type === "mcq_test" &&
      legacy.userId === uid &&
      legacy.subject === test.subject &&
      legacy.unitId === test.unitId &&
      legacy.sourceId === test.testId;
    const wasCompleted = recordExists || legacyMatches;
    const key = completedTestKey(test);
    if (key === currentKey) alreadyCompleted = Boolean(wasCompleted);
    if (wasCompleted || key === currentKey) {
      completed.add(key);
      if (!recordExists)
        backfill.push({
          index,
          completedAt:
            legacyMatches && legacy?.occurredAt instanceof Timestamp
              ? legacy.occurredAt
              : FieldValue.serverTimestamp(),
        });
    }
  });
  const subjectCompleted =
    !subjectSnapshot.exists &&
    required.length > 0 &&
    required.every((test) => completed.has(completedTestKey(test)));
  return {
    alreadyCompleted,
    subjectCompleted,
    write: () => {
      for (const { index, completedAt } of backfill) {
        const test = tests[index]!;
        transaction.create(refs[index]!.completed, {
          ...test,
          testKey: completedTestKey(test),
          completedAt,
        });
      }
      if (subjectCompleted)
        transaction.create(subjectRef, {
          subject: current.subject,
          requiredTestKeys: required.map(completedTestKey),
          completedAt: FieldValue.serverTimestamp(),
        });
    },
  };
}
