import { NextResponse, type NextRequest } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb, hasExplicitAdminCredentials } from "@/lib/firebase-admin";
import {
  dashboardDocumentPaths,
  type ActivityAwardResponse,
  type GradeStatus,
} from "@/types/dashboard";
import {
  readStreakState,
  recordActiveDay,
  resolveActivityDay,
} from "@/lib/gamification/streak";
import { addXp, readXpTotal, streakXp } from "@/lib/gamification/xp";
import { loadXpConfig } from "@/lib/gamification/loadXpConfig";
import { isDocumentId, requireUser } from "@/lib/server/activityRequest";
import { awardAchievements } from "@/lib/server/awardAchievements";

/**
 * How long after submitting an FRQ it can still be recorded. The browser
 * reports a submission straight after writing it, so this only has to cover a
 * slow network. Without a limit, a pile of old submissions could each be
 * replayed on a later day to keep a streak going without studying.
 */
const RECORDING_WINDOW_MS = 60 * 60 * 1000;

// A self-grade or a staff grade moves a submission out of the queue under the
// same id, so it may already be a result by the time it is reported.
const SUBMISSION_COLLECTIONS: [string, GradeStatus][] = [
  ["ungraded-frqs", "pending"],
  ["self-graded-frqs", "self_graded"],
  ["graded-frqs", "graded"],
];

const nonNegativeNumber = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : fallback;

/**
 * The FRQ's title and a link back to it, for the dashboard's activity list,
 * and whether it is published.
 */
async function describeFrq(
  subject: string,
  unitId: string,
  templateId: string,
): Promise<{ label: string; href: string; isPublic: boolean }> {
  const adminDb = getAdminDb();
  const [subjectSnapshot, templateSnapshot] = await adminDb.getAll(
    adminDb.collection("subjects").doc(subject),
    adminDb
      .collection("subjects")
      .doc(subject)
      .collection("units")
      .doc(unitId)
      .collection("frqs")
      .doc(templateId),
  );

  const template = templateSnapshot?.data();
  const title: unknown = template?.title;
  const subjectData = subjectSnapshot?.data();
  const units: unknown[] = Array.isArray(subjectData?.units)
    ? subjectData.units
    : [];
  const unitIndex = units.findIndex(
    (unit) =>
      typeof unit === "object" &&
      unit !== null &&
      "id" in unit &&
      unit.id === unitId,
  );
  const unitNumber = subjectData?.hasUnit0 === true ? unitIndex : unitIndex + 1;

  return {
    label: typeof title === "string" && title.trim() ? title : "FRQ",
    href:
      unitIndex >= 0
        ? `/subject/${subject}/unit-${unitNumber}-${unitId}/frq/${templateId}`
        : `/subject/${subject}`,
    isPublic: template?.isPublic === true,
  };
}

/**
 * Records a submitted FRQ as study activity: it counts toward the student's
 * daily streak and their activity calendar, and earns XP. The submission is
 * re-read here rather than trusted from the request, and each one is only
 * counted once.
 *
 * Submission XP is paid once per FRQ, not per submission: nothing limits how
 * often a student can resubmit, so paying every time would let them farm XP
 * by submitting the same FRQ over and over. A resubmission still counts
 * toward the streak. An unpublished FRQ isn't recorded at all, matching the
 * MCQ route, so staff previewing a draft earn nothing from it.
 */
export async function POST(request: NextRequest) {
  const caller = await requireUser(request);
  if ("error" in caller) return caller.error;
  const { uid } = caller;
  const adminDb = getAdminDb();

  const body = (await request.json().catch(() => null)) as {
    submissionId?: unknown;
    timeZone?: unknown;
  } | null;
  const submissionId = body?.submissionId;
  if (!isDocumentId(submissionId)) {
    return NextResponse.json(
      { error: "submissionId must be a valid document ID" },
      { status: 400 },
    );
  }

  let submission: Record<string, unknown> | undefined;
  let gradeStatus: GradeStatus = "pending";
  try {
    const snapshots = await adminDb.getAll(
      ...SUBMISSION_COLLECTIONS.map(([collection]) =>
        adminDb.collection(collection).doc(submissionId),
      ),
    );
    const found = snapshots.findIndex((snapshot) => snapshot.exists);
    if (found >= 0) {
      submission = snapshots[found]!.data();
      gradeStatus = SUBMISSION_COLLECTIONS[found]![1];
    }
  } catch (error) {
    console.error("Unable to read FRQ submission with Admin SDK", error);
    return NextResponse.json(
      {
        error: hasExplicitAdminCredentials
          ? "Unable to read submission"
          : "Server-side Firebase credentials are not configured",
      },
      { status: 503 },
    );
  }

  // Someone else's submission gets the same answer as a missing one, so this
  // can't be used to probe which submission ids exist.
  if (!submission || submission.studentId !== uid) {
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 },
    );
  }

  const now = new Date();
  const { submittedAt, subject, unitId, templateId } = submission;
  if (
    !(submittedAt instanceof Timestamp) ||
    now.getTime() - submittedAt.toMillis() > RECORDING_WINDOW_MS
  ) {
    return NextResponse.json(
      { error: "Submission is too old to record" },
      { status: 409 },
    );
  }
  if (
    !isDocumentId(subject) ||
    !isDocumentId(unitId) ||
    !isDocumentId(templateId)
  ) {
    return NextResponse.json(
      { error: "Submission is missing its FRQ" },
      { status: 422 },
    );
  }

  const eventRef = adminDb.doc(
    dashboardDocumentPaths.activity(`${uid}_frq_${submissionId}`),
  );
  const statsRef = adminDb.doc(dashboardDocumentPaths.stats(uid));
  // A server-only receipt: its existence means this student has already been
  // paid for submitting this FRQ.
  const xpAwardRef = adminDb
    .collection("xpAwards")
    .doc(`${uid}_frq_${templateId}`);

  try {
    const [{ label, href, isPublic }, xpConfig] = await Promise.all([
      describeFrq(subject, unitId, templateId),
      loadXpConfig(),
    ]);
    // The Admin SDK bypasses Firestore rules, so the publication boundary has
    // to be checked here, as the MCQ route does.
    if (!isPublic) {
      return NextResponse.json(
        { error: "FRQ is not published" },
        { status: 403 },
      );
    }

    const result = await adminDb.runTransaction(async (transaction) => {
      const [event, stats, xpAward] = await transaction.getAll(
        eventRef,
        statsRef,
        xpAwardRef,
      );
      const statsData = stats?.data();
      const streak = readStreakState(statsData);
      const totalXp = readXpTotal(statsData);
      const response: ActivityAwardResponse = {
        xpAwarded: 0,
        totalXp,
        level: nonNegativeNumber(statsData?.level, 1),
        leveledUp: false,
        currentStreak: streak.currentStreak,
        newlyUnlocked: [],
        alreadyRecorded: true,
      };
      if (event?.exists) return response;

      const { day, timeZone } = resolveActivityDay(
        now,
        statsData?.timeZone,
        body?.timeZone,
      );
      const next = recordActiveDay(streak, day);
      const year = day.slice(0, 4);
      const calendarRef = adminDb.doc(
        dashboardDocumentPaths.calendar(uid, year),
      );

      const paysSubmissionXp = !xpAward?.exists;
      const xpAwarded =
        (paysSubmissionXp ? xpConfig.frqSubmission : 0) +
        streakXp(streak, next, xpConfig);
      const progress = addXp(totalXp, xpAwarded);
      const newlyUnlocked = await awardAchievements(transaction, adminDb, uid, {
        ...statsData, level: progress.level, longestStreak: next.longestStreak,
        frqsSubmitted: nonNegativeNumber(statsData?.frqsSubmitted, 0) + 1,
      });

      if (paysSubmissionXp) {
        transaction.create(xpAwardRef, {
          userId: uid,
          type: "frq",
          subject,
          unitId,
          sourceId: templateId,
          submissionId,
          xpAwarded: xpConfig.frqSubmission,
          awardedAt: FieldValue.serverTimestamp(),
        });
      }

      transaction.create(eventRef, {
        id: eventRef.id,
        userId: uid,
        type: "frq",
        subject,
        unitId,
        sourceId: submissionId,
        label,
        href,
        occurredAt: FieldValue.serverTimestamp(),
        dayKey: day,
        xpAwarded,
        gradeStatus,
      });
      transaction.set(
        statsRef,
        {
          uid,
          xp: progress.xp,
          level: progress.level,
          xpIntoLevel: progress.xpIntoLevel,
          xpForNextLevel: progress.xpForNextLevel,
          currentStreak: next.currentStreak,
          longestStreak: next.longestStreak,
          lastActiveDay: next.lastActiveDay,
          timeZone,
          frqsSubmitted: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      transaction.set(
        calendarRef,
        {
          uid,
          year: Number(year),
          days: { [day]: FieldValue.increment(1) },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      return {
        ...response,
        xpAwarded,
        totalXp: progress.xp,
        level: progress.level,
        leveledUp: progress.leveledUp,
        newlyUnlocked,
        currentStreak: next.currentStreak,
        alreadyRecorded: false,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Unable to record submitted FRQ", error);
    return NextResponse.json(
      { error: "Unable to record submitted FRQ" },
      { status: 500 },
    );
  }
}
