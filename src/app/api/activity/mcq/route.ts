import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, hasExplicitAdminCredentials } from "@/lib/firebase-admin";
import { dashboardDocumentPaths, type ActivityAwardResponse } from "@/types/dashboard";
import { readStreakState, recordActiveDay, resolveActivityDay } from "@/lib/gamification/streak";
import { addXp, readXpTotal, streakXp, type XpConfig } from "@/lib/gamification/xp";
import { loadXpConfig } from "@/lib/gamification/loadXpConfig";
import { isDocumentId, requireUser } from "@/lib/server/activityRequest";

type SubmittedAnswers = Record<number, string[]>;
type StoredQuestion = { type?: unknown; answers?: unknown; topic?: unknown };

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string")
    ? value
    : [];

const sameOptionIds = (submitted: string[], official: string[]) => {
  const submittedIds = new Set(submitted);
  const officialIds = new Set(official);
  return submittedIds.size === submitted.length && submittedIds.size === officialIds.size &&
    [...submittedIds].every((id) => officialIds.has(id));
};

function parseAnswers(value: unknown): SubmittedAnswers | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const answers: SubmittedAnswers = {};
  for (const [index, answerIds] of Object.entries(value)) {
    if (!/^\d+$/.test(index) || !Array.isArray(answerIds)) return null;
    const parsed: string[] = [];
    for (const answerId of answerIds) {
      if (typeof answerId !== "string" || answerId.length === 0) return null;
      parsed.push(answerId);
    }
    answers[Number(index)] = parsed;
  }
  return answers;
}

const awardResponse = (
  xpAwarded: number,
  totalXp: number,
  level: number,
  leveledUp: boolean,
  currentStreak: number,
  alreadyRecorded: boolean,
): ActivityAwardResponse => ({
  xpAwarded,
  totalXp,
  level,
  leveledUp,
  currentStreak,
  newlyUnlocked: [],
  alreadyRecorded,
});

/** Grades a published MCQ test on the server and awards its one-time XP. */
export async function POST(request: NextRequest) {
  const caller = await requireUser(request);
  if ("error" in caller) return caller.error;
  const { uid } = caller;
  const adminDb = getAdminDb();

  const body = (await request.json().catch(() => null)) as {
    subject?: unknown; unitId?: unknown; testId?: unknown; answers?: unknown; timeZone?: unknown;
  } | null;
  const { subject, unitId, testId } = body ?? {};
  const answers = parseAnswers(body?.answers);
  if (!isDocumentId(subject) || !isDocumentId(unitId) || !isDocumentId(testId) || !answers) {
    return NextResponse.json({ error: "subject, unitId, testId, and answers must be valid" }, { status: 400 });
  }

  const testRef = adminDb.collection("subjects").doc(subject).collection("units").doc(unitId)
    .collection("tests").doc(testId);
  let test;
  let xpConfig: XpConfig;
  try {
    [test, xpConfig] = await Promise.all([testRef.get(), loadXpConfig()]);
  } catch (error) {
    console.error("Unable to read MCQ test with Admin SDK", error);
    return NextResponse.json(
      {
        error: hasExplicitAdminCredentials
          ? "Unable to read test"
          : "Server-side Firebase credentials are not configured",
      },
      { status: 503 },
    );
  }
  if (!test.exists) return NextResponse.json({ error: "Test not found" }, { status: 404 });

  const testData = test.data();
  // The Admin SDK bypasses Firestore rules, so preserve the publication
  // boundary before reading answers or awarding any XP.
  if (testData?.isPublic !== true) {
    return NextResponse.json({ error: "Test is not published" }, { status: 403 });
  }
  const subjectData = (await adminDb.collection("subjects").doc(subject).get()).data();
  const units = Array.isArray(subjectData?.units) ? subjectData.units as Array<{ id?: unknown; chapters?: unknown }> : [];
  const unitIndex = units.findIndex((unit) => unit.id === unitId);
  if (unitIndex < 0) {
    return NextResponse.json({ error: "Unit not found in subject" }, { status: 404 });
  }
  const unitNumber = subjectData?.hasUnit0 === true ? unitIndex : unitIndex + 1;
  const href = `/subject/${subject}/unit-${unitNumber}-${unitId}/test/${testId}`;
  const totalReadings = units.reduce((count, unit) => count + (Array.isArray(unit.chapters) ? unit.chapters.length : 0), 0);
  const questions = Array.isArray(testData?.questions) ? testData.questions as StoredQuestion[] : [];
  const results = questions.map((question, index) => {
    const officialAnswers = asStringArray(question.answers);
    const gradable = (question.type === "mcq" || question.type === "multi-answer") && officialAnswers.length > 0;
    return { gradable, correct: gradable && sameOptionIds(answers[index] ?? [], officialAnswers), topic: typeof question.topic === "string" ? question.topic : "" };
  });
  const total = results.filter((result) => result.gradable).length;
  if (total === 0) return NextResponse.json({ error: "Test has no gradable questions" }, { status: 400 });

  const correct = results.filter((result) => result.correct).length;
  const testXp = xpConfig.mcqTestComplete + correct * xpConfig.mcqCorrectAnswer;
  const eventRef = adminDb.doc(dashboardDocumentPaths.activity(`${uid}_mcq_test_${testId}`));
  const statsRef = adminDb.doc(dashboardDocumentPaths.stats(uid));

  try {
    const result = await adminDb.runTransaction(async (transaction) => {
      const event = await transaction.get(eventRef);
      const stats = await transaction.get(statsRef);
      const statsData = stats.data() ?? {};
      const totalXp = readXpTotal(statsData);
      const level = typeof statsData.level === "number" ? statsData.level : 1;
      const previousStreak = readStreakState(statsData);
      if (event.exists) return awardResponse(0, totalXp, level, false, previousStreak.currentStreak, true);

      // Shared with the FRQ route so both count days, and keep streaks, alike.
      const { day: dayKey, timeZone } = resolveActivityDay(new Date(), statsData.timeZone, body?.timeZone);
      const streak = recordActiveDay(previousStreak, dayKey);
      const xpAwarded = testXp + streakXp(previousStreak, streak, xpConfig);
      const progress = addXp(totalXp, xpAwarded);
      const year = dayKey.slice(0, 4);
      const calendarRef = adminDb.doc(dashboardDocumentPaths.calendar(uid, year));
      const calendar = await transaction.get(calendarRef);
      const calendarDays = (calendar.data()?.days ?? {}) as Record<string, unknown>;
      const currentDayCount = typeof calendarDays[dayKey] === "number" ? calendarDays[dayKey] : 0;
      const perSubject = typeof statsData.perSubject === "object" && statsData.perSubject !== null
        ? statsData.perSubject as Record<string, Record<string, unknown>>
        : {};
      const subjectProgress = perSubject[subject] ?? {};

      transaction.set(eventRef, {
        id: eventRef.id,
        userId: uid, type: "mcq_test", subject, unitId, sourceId: testId,
        label: typeof testData?.name === "string" ? testData.name : "Unit Test",
        href,
        occurredAt: FieldValue.serverTimestamp(), dayKey, xpAwarded, gradeStatus: "none",
        score: { correct, total },
        questions: results.flatMap((question, index) => question.gradable
          ? [{ index: index + 1, topic: question.topic, correct: question.correct }]
          : []),
      });
      transaction.set(statsRef, {
        uid, xp: progress.xp, level: progress.level,
        xpIntoLevel: progress.xpIntoLevel,
        xpForNextLevel: progress.xpForNextLevel,
        currentStreak: streak.currentStreak, longestStreak: streak.longestStreak,
        lastActiveDay: streak.lastActiveDay, timeZone,
        readingsCompleted: typeof statsData.readingsCompleted === "number" ? statsData.readingsCompleted : 0,
        mcqTestsCompleted: (typeof statsData.mcqTestsCompleted === "number" ? statsData.mcqTestsCompleted : 0) + 1,
        problemsSolved: (typeof statsData.problemsSolved === "number" ? statsData.problemsSolved : 0) + correct,
        frqsSubmitted: typeof statsData.frqsSubmitted === "number" ? statsData.frqsSubmitted : 0,
        subjectsCompleted: typeof statsData.subjectsCompleted === "number" ? statsData.subjectsCompleted : 0,
        perSubject: {
          ...perSubject,
          [subject]: {
            ...subjectProgress,
            subjectSlug: subject,
            attempted: (typeof subjectProgress.attempted === "number" ? subjectProgress.attempted : 0) + total,
            correct: (typeof subjectProgress.correct === "number" ? subjectProgress.correct : 0) + correct,
            readingsCompleted: typeof subjectProgress.readingsCompleted === "number" ? subjectProgress.readingsCompleted : 0,
            totalReadings,
            lastActiveAt: FieldValue.serverTimestamp(),
          },
        },
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      transaction.set(calendarRef, { uid, year: Number(year), days: { ...calendarDays, [dayKey]: currentDayCount + 1 }, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      return awardResponse(xpAwarded, progress.xp, progress.level, progress.leveledUp, streak.currentStreak, false);
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Unable to record completed MCQ test", error);
    return NextResponse.json({ error: "Unable to record completed test" }, { status: 500 });
  }
}
