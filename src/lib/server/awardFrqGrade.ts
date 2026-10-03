import { FieldValue, type Firestore } from "firebase-admin/firestore";
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
 * Payouts belong to a submission, whose result ID remains stable on regrades.
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
    // Unlike submission XP, this receipt tracks grade XP for this attempt.
    // A separate namespace keeps submission and grade rewards independent.
    const receiptRef = db
      .collection("xpAwards")
      .doc(`frq_grade_${submissionId}`);
    const [stats, receipt] = await transaction.getAll(statsRef, receiptRef);
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

    const entitledXp = gradeXpForScore(grade.score, config.frqGradeBonus);
    const previous = receipt?.data() as Record<string, unknown> | undefined;
    const paid = receipt?.exists ? previous?.xpAwarded : 0;
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
    if (xpAwarded === 0) return response;

    const next = addXp(progress.xp, xpAwarded);
    transaction.set(receiptRef, {
      userId: studentId,
      type: "frq_grade",
      subject,
      unitId,
      templateId,
      sourceId: submissionId,
      submissionId,
      graderId,
      score: grade.score as string,
      gradeBonus: config.frqGradeBonus,
      xpAwarded: entitledXp,
      awardedAt: FieldValue.serverTimestamp(),
    });
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
      alreadyRecorded: false,
    };
  });
}
