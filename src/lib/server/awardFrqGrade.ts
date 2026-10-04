import {
  FieldValue,
  Timestamp,
  type Firestore,
} from "firebase-admin/firestore";
import { createNotification } from "./createNotification.ts";
import { awardAchievements } from "./awardAchievements.ts";
import {
  dashboardDocumentPaths,
  type ActivityAwardResponse,
} from "../../types/dashboard.ts";
import { addXp, readXpTotal, type XpConfig } from "../gamification/xp.ts";
import { readStreakState } from "../gamification/streak.ts";

export class FrqGradeAwardError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const validId = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0 && !value.includes("/");

/** The aggregate saved by the grader is a score snapshot, e.g. "4/6". */
export function gradeXpForScore(score: unknown, bonus: number): number {
  const match =
    typeof score === "string"
      ? /^\s*(-?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*$/.exec(score)
      : null;
  const earned = Number(match?.[1]);
  const maximum = Number(match?.[2]);
  if (
    !match ||
    !Number.isFinite(earned) ||
    !Number.isFinite(maximum) ||
    maximum <= 0
  ) {
    throw new FrqGradeAwardError(
      "Saved grade must contain a valid score and positive maximum",
      422,
    );
  }
  return Math.round(Math.min(1, Math.max(0, earned / maximum)) * bonus);
}

/**
 * Payouts belong to the student's FRQ template, shared by every attempt.
 * Read the role, saved grade, receipt and stats in the same transaction so a
 * concurrent edit or payout retries against the latest trusted state.
 */
export async function awardFrqGrade(
  db: Firestore,
  callerUid: string,
  submissionId: string,
  config: Pick<XpConfig, "frqGradeBonus">,
): Promise<ActivityAwardResponse> {
  return db.runTransaction(async (transaction) => {
    const [caller, official, self] = await transaction.getAll(
      db.collection("users").doc(callerUid),
      db.collection("graded-frqs").doc(submissionId),
      db.collection("self-graded-frqs").doc(submissionId),
    );
    const access: unknown = caller?.data()?.access;
    if (access !== "admin" && access !== "member" && access !== "grader") {
      throw new FrqGradeAwardError("Staff access required", 403);
    }

    const grade: Record<string, unknown> | undefined = official?.exists
      ? official.data()
      : self?.data();
    if (!grade) throw new FrqGradeAwardError("Saved grade not found", 404);
    const {
      studentId,
      graderId,
      subject,
      unitId,
      templateId,
      sourceSubmissionId,
    } = grade;
    if (
      !validId(studentId) ||
      !validId(graderId) ||
      !validId(subject) ||
      !validId(unitId) ||
      !validId(templateId) ||
      sourceSubmissionId !== submissionId
    ) {
      throw new FrqGradeAwardError(
        "Saved grade has invalid submission identity",
        422,
      );
    }

    const statsRef = db.doc(dashboardDocumentPaths.stats(studentId));
    // Submission XP already scopes awards to studentId + templateId. Use the
    // same FRQ identity, with a separate namespace for cumulative grade XP.
    const receiptRef = db
      .collection("xpAwards")
      .doc(`${studentId}_frq_grade_${templateId}`);
    // Keep notification deduplication per submission, including legacy receipts.
    const notificationReceiptRef = db
      .collection("xpAwards")
      .doc(`frq_grade_${submissionId}`);
    const [stats, receipt, notificationReceipt] = await transaction.getAll(
      statsRef,
      receiptRef,
      notificationReceiptRef,
    );
    const statsData = stats?.data();
    const progress = addXp(readXpTotal(statsData), 0);
    const response: ActivityAwardResponse = {
      xpAwarded: 0,
      totalXp: progress.xp,
      level: progress.level,
      leveledUp: false,
      currentStreak: readStreakState(statsData).currentStreak,
      newlyUnlocked: [],
      alreadyRecorded: true,
    };

    // Collection membership and ownership both identify self-assessments.
    if (!official?.exists || graderId === studentId) return response;

    if (!(grade.gradedAt instanceof Timestamp)) {
      throw new FrqGradeAwardError(
        "Saved grade has no valid grading timestamp",
        422,
      );
    }

    const entitledXp = gradeXpForScore(grade.score, config.frqGradeBonus);
    const previous = receipt?.data() as Record<string, unknown> | undefined;
    let paid: unknown = receipt?.exists ? previous?.xpAwarded : 0;
    const notificationState = notificationReceipt?.data() as
      | Record<string, unknown>
      | undefined;
    if (
      notificationReceipt?.exists &&
      ((notificationState?.type !== "frq_grade" &&
        notificationState?.type !== "frq_grade_notification") ||
        notificationState?.userId !== studentId ||
        notificationState.subject !== subject ||
        notificationState.unitId !== unitId ||
        notificationState.templateId !== templateId)
    )
      throw new FrqGradeAwardError("Grade payout receipt is inconsistent", 409);

    if (!receipt?.exists) {
      // Carry forward all XP already paid by the old attempt-scoped version.
      // A single-field query needs no new composite index. Migration is atomic
      // with the first FRQ-scoped payout and is never repeated afterwards.
      const legacy = await transaction.get(
        db.collection("xpAwards").where("userId", "==", studentId),
      );
      let legacyPaid = 0;
      for (const document of legacy.docs) {
        const data = document.data() as Record<string, unknown>;
        if (data.type !== "frq_grade" || data.templateId !== templateId)
          continue;
        if (
          data.subject !== subject ||
          data.unitId !== unitId ||
          typeof data.xpAwarded !== "number" ||
          !Number.isSafeInteger(data.xpAwarded) ||
          data.xpAwarded < 0
        )
          throw new FrqGradeAwardError(
            "Grade payout receipt is inconsistent",
            409,
          );
        legacyPaid += data.xpAwarded;
      }
      paid = legacyPaid;
    }
    if (
      typeof paid !== "number" ||
      !Number.isSafeInteger(paid) ||
      paid < 0 ||
      (receipt?.exists &&
        (!previous ||
          previous.userId !== studentId ||
          previous.subject !== subject ||
          previous.unitId !== unitId ||
          previous.templateId !== templateId))
    ) {
      throw new FrqGradeAwardError("Grade payout receipt is inconsistent", 409);
    }
    const xpAwarded = Math.max(0, entitledXp - paid);
    const notificationRef = db.doc(
      dashboardDocumentPaths.notification(
        studentId,
        `frq_graded_${submissionId}`,
      ),
    );
    const notification = await transaction.get(notificationRef);
    const shouldNotify =
      notificationState?.notificationCreated !== true && !notification.exists;
    if (
      xpAwarded === 0 &&
      !shouldNotify &&
      notificationState?.notificationCreated === true &&
      receipt?.exists
    )
      return response;

    const next = addXp(progress.xp, xpAwarded);
    const newlyUnlocked =
      xpAwarded > 0
        ? await awardAchievements(transaction, db, studentId, {
            ...statsData,
            level: next.level,
          })
        : [];
    if (shouldNotify) {
      createNotification(transaction, notificationRef, {
        type: "frq_graded",
        title: "FRQ graded",
        body: `Your FRQ was graded: ${grade.score as string}. View your feedback.`,
        href: `/frq-feedback/${submissionId}`,
      });
    }

    transaction.set(receiptRef, {
      userId: studentId,
      type: "frq_grade",
      subject,
      unitId,
      templateId,
      sourceId: templateId,
      submissionId,
      graderId,
      score: grade.score as string,
      gradeBonus: config.frqGradeBonus,
      xpAwarded: paid + xpAwarded,
      awardedAt: FieldValue.serverTimestamp(),
    });
    if (notificationState?.notificationCreated !== true) {
      // Preserve old payout amounts for migration; new attempt markers hold no XP.
      transaction.set(
        notificationReceiptRef,
        notificationReceipt?.exists
          ? { notificationCreated: true }
          : {
              userId: studentId,
              type: "frq_grade_notification",
              subject,
              unitId,
              templateId,
              submissionId,
              notificationCreated: true,
            },
        { merge: true },
      );
    }
    if (xpAwarded > 0)
      transaction.set(
        statsRef,
        {
          uid: studentId,
          xp: next.xp,
          level: next.level,
          xpIntoLevel: next.xpIntoLevel,
          xpForNextLevel: next.xpForNextLevel,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    return {
      ...response,
      xpAwarded,
      totalXp: next.xp,
      level: next.level,
      leveledUp: next.leveledUp,
      newlyUnlocked,
      alreadyRecorded: false,
    };
  });
}
