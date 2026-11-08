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

/** Published test identities already mirrored by the subject editor's save. */
export async function requiredSubjectTests(
  transaction: Transaction,
  db: Firestore,
  subject: string,
): Promise<TestIdentity[]> {
  const curriculum = await transaction.get(db.doc(`subjects/${subject}`));
  const units: unknown = curriculum.data()?.units;
  const tests = new Map<string, TestIdentity>();
  for (const rawUnit of (Array.isArray(units) ? units : []) as unknown[]) {
    if (typeof rawUnit !== "object" || rawUnit === null) continue;
    const unit = rawUnit as Record<string, unknown>;
    if (!validId(unit.id)) continue;
    if (Array.isArray(unit.tests)) {
      for (const rawTest of unit.tests as unknown[]) {
        if (typeof rawTest !== "object" || rawTest === null) continue;
        const test = rawTest as Record<string, unknown>;
        if (validId(test.id) && test.isPublic === true) {
          const identity = { subject, unitId: unit.id, testId: test.id };
          tests.set(completedTestKey(identity), identity);
        }
      }
    } else if (unit.test === true && validId(unit.testId)) {
      // Old single-test units name the test, but do not mirror publication.
      const test = await transaction.get(
        db.doc(`subjects/${subject}/units/${unit.id}/tests/${unit.testId}`),
      );
      if (test.data()?.isPublic === true) {
        const identity = { subject, unitId: unit.id, testId: unit.testId };
        tests.set(completedTestKey(identity), identity);
      }
    }
  }
  return [...tests.values()];
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
  statsData?: Record<string, unknown>,
) {
  const currentKey = completedTestKey(current);
  const currentRef = db.doc(
    dashboardDocumentPaths.completedTest(uid, currentKey),
  );
  const record = await transaction.get(currentRef);
  if (record.exists)
    return {
      alreadyCompleted: true,
      subjectCompleted: false,
      write: () => {
        // The durable completion receipt already exists.
      },
    };
  const legacy = await transaction.get(
    db.doc(
      dashboardDocumentPaths.activity(`${uid}_mcq_test_${current.testId}`),
    ),
  );
  const legacyData = legacy?.data();
  const alreadyCompleted =
    legacyData?.type === "mcq_test" &&
    legacyData.userId === uid &&
    legacyData.subject === current.subject &&
    legacyData.unitId === current.unitId &&
    legacyData.sourceId === current.testId;
  const writeCurrent = () => {
    transaction.create(currentRef, {
      ...current,
      testKey: currentKey,
      completedAt:
        alreadyCompleted && legacyData?.occurredAt instanceof Timestamp
          ? legacyData.occurredAt
          : FieldValue.serverTimestamp(),
    });
  };
  // Retakes never inspect curriculum, other completions, or subject state.
  if (alreadyCompleted)
    return {
      alreadyCompleted: true,
      subjectCompleted: false,
      write: writeCurrent,
    };
  const subjectRef = db.doc(
    dashboardDocumentPaths.completedSubject(uid, current.subject),
  );
  const subjectSnapshot = await transaction.get(subjectRef);
  if (subjectSnapshot.exists)
    return {
      alreadyCompleted: false,
      subjectCompleted: false,
      write: writeCurrent,
    };

  const required = await requiredSubjectTests(transaction, db, current.subject);
  const keys = required.map(completedTestKey);
  const requiredKeys = new Set(keys);
  const statsRef = db.doc(dashboardDocumentPaths.stats(uid));
  const stats = statsData ?? (await transaction.get(statsRef)).data();
  const progress = stats?.perSubject as
    | Record<string, { completionReceiptsMigrated?: unknown }>
    | undefined;
  const migrated =
    progress?.[current.subject]?.completionReceiptsMigrated === true;
  const backfill: {
    test: TestIdentity;
    completedAt: Timestamp | FieldValue;
  }[] = [];
  if (!migrated && keys.length > 0 && stats?.mcqTestsCompleted !== 0) {
    // One-time migration of pre-receipt activity evidence, not a curriculum scan.
    // The existing single-field index avoids a new composite index/migration.
    const events = await transaction.get(
      db.collection("activityEvents").where("userId", "==", uid),
    );
    const candidates = new Map<
      string,
      { test: TestIdentity; completedAt: Timestamp | FieldValue }
    >();
    for (const event of events.docs) {
      const data = event.data();
      if (
        data.type !== "mcq_test" ||
        data.subject !== current.subject ||
        !validId(data.unitId) ||
        !validId(data.sourceId)
      )
        continue;
      const test = {
        subject: current.subject,
        unitId: data.unitId,
        testId: data.sourceId,
      };
      const key = completedTestKey(test);
      if (key !== currentKey)
        candidates.set(key, {
          test,
          completedAt:
            data.occurredAt instanceof Timestamp
              ? data.occurredAt
              : FieldValue.serverTimestamp(),
        });
    }
    if (candidates.size > 0) {
      const existing = await transaction.getAll(
        ...[...candidates.keys()].map((key) =>
          db.doc(dashboardDocumentPaths.completedTest(uid, key)),
        ),
      );
      [...candidates.values()].forEach((candidate, index) => {
        if (!existing[index]?.exists) backfill.push(candidate);
      });
    }
  }
  // Count only currently required stable identities. Private, removed, or
  // orphaned tests never satisfy the subject, even if previously completed.
  // Firestore permits at most 30 values in an `in` filter. Aggregate queries
  // run inside the same transaction and return no completion/test documents.
  let completedCount =
    backfill.filter(({ test }) => requiredKeys.has(completedTestKey(test)))
      .length + (requiredKeys.has(currentKey) ? 1 : 0);
  for (let offset = 0; offset < keys.length; offset += 30) {
    const count = await transaction.get(
      db
        .collection(`users/${uid}/completedTests`)
        .where("testKey", "in", keys.slice(offset, offset + 30))
        .count(),
    );
    completedCount += count.data().count;
  }
  const subjectCompleted = keys.length > 0 && completedCount === keys.length;
  return {
    alreadyCompleted: false,
    subjectCompleted,
    write: () => {
      writeCurrent();
      for (const { test, completedAt } of backfill)
        transaction.create(
          db.doc(
            dashboardDocumentPaths.completedTest(uid, completedTestKey(test)),
          ),
          { ...test, testKey: completedTestKey(test), completedAt },
        );
      if (!migrated && keys.length > 0)
        transaction.set(
          statsRef,
          {
            perSubject: {
              [current.subject]: { completionReceiptsMigrated: true },
            },
          },
          { merge: true },
        );
      if (subjectCompleted)
        transaction.create(subjectRef, {
          subject: current.subject,
          requiredTestKeys: keys,
          completedAt: FieldValue.serverTimestamp(),
        });
    },
  };
}
