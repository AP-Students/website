import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { formatSlug } from "@/lib/utils";
import type { ActivityAwardResponse } from "@/types/dashboard";
import { addXp, readXpTotal } from "@/lib/gamification/xp";
import { loadXpConfig } from "@/lib/gamification/loadXpConfig";

const isDocumentId = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0 && !value.includes("/");

const nonNegativeNumber = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : fallback;

const record = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};

const dayKeyFor = (timeZone: unknown) => {
  const resolvedTimeZone = typeof timeZone === "string" ? timeZone : "UTC";

  try {
    const values = new Intl.DateTimeFormat("en-US", {
      timeZone: resolvedTimeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(new Date())
      .reduce<Record<string, string>>((parts, part) => {
        parts[part.type] = part.value;
        return parts;
      }, {});
    return `${values.year}-${values.month}-${values.day}`;
  } catch {
    return dayKeyFor("UTC");
  }
};

/**
 * Records a completed chapter and awards its one-time reading XP. Readings
 * don't count toward a streak (#264), so they earn no streak bonus.
 */
export async function POST(request: NextRequest) {
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();
  const idToken = request.headers
    .get("authorization")
    ?.match(/^Bearer (.+)$/i)?.[1];

  if (!idToken) {
    return NextResponse.json(
      { error: "Missing authorization token" },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    subject?: unknown;
    unitId?: unknown;
    chapterId?: unknown;
  } | null;
  const { subject, unitId, chapterId } = body ?? {};
  if (
    !isDocumentId(subject) ||
    !isDocumentId(unitId) ||
    !isDocumentId(chapterId)
  ) {
    return NextResponse.json(
      { error: "subject, unitId, and chapterId must be valid document IDs" },
      { status: 400 },
    );
  }

  let uid: string;
  try {
    uid = (await adminAuth.verifyIdToken(idToken)).uid;
  } catch {
    return NextResponse.json(
      { error: "Invalid authorization token" },
      { status: 401 },
    );
  }

  const subjectRef = adminDb.collection("subjects").doc(subject);
  const chapterRef = subjectRef
    .collection("units")
    .doc(unitId)
    .collection("chapters")
    .doc(chapterId);
  const [subjectSnapshot, chapterSnapshot, xpConfig] = await Promise.all([
    subjectRef.get(),
    chapterRef.get(),
    loadXpConfig(),
  ]);
  if (!chapterSnapshot.exists) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  const chapterTitleValue = record(chapterSnapshot.data() as unknown).title;
  const chapterTitle =
    typeof chapterTitleValue === "string" ? chapterTitleValue : chapterId;
  const subjectData = record(subjectSnapshot.data() as unknown);
  const units = Array.isArray(subjectData.units)
    ? subjectData.units.map(record)
    : [];
  const unitIndex = units.findIndex((unit) => unit.id === unitId);
  const displayUnit = subjectData.hasUnit0 === true ? unitIndex : unitIndex + 1;
  const href =
    unitIndex >= 0
      ? `/subject/${subject}/unit-${displayUnit}-${unitId}/chapter/${chapterId}/${formatSlug(chapterTitle)}`
      : `/subject/${subject}`;
  const totalReadings = units.reduce(
    (count, unit) =>
      count + (Array.isArray(unit.chapters) ? unit.chapters.length : 0),
    0,
  );

  try {
    const result = await adminDb.runTransaction(async (transaction) => {
      const chapterDataRef = adminDb
        .collection("users")
        .doc(uid)
        .collection("chapterData")
        .doc(chapterId);
      const statsRef = adminDb.collection("userStats").doc(uid);
      const activityRef = adminDb
        .collection("activityEvents")
        .doc(`${uid}_reading_${chapterId}`);
      const [stats, chapterData, activity] = await Promise.all([
        transaction.get(statsRef),
        transaction.get(chapterDataRef),
        transaction.get(activityRef),
      ]);
      const statsData = stats.data();
      const totalXp = readXpTotal(statsData);
      const level = nonNegativeNumber(statsData?.level, 1);
      const currentStreak = nonNegativeNumber(statsData?.currentStreak, 0);

      if (chapterData.data()?.readingXpAwarded === true) {
        // Writes omitted by a prior deployment are safely backfilled without
        // changing XP or creating a duplicate event.
        if (!activity.exists) {
          transaction.create(activityRef, {
            id: activityRef.id,
            userId: uid,
            type: "reading",
            subject,
            unitId,
            sourceId: chapterId,
            label: chapterTitle,
            href,
            occurredAt: FieldValue.serverTimestamp(),
            dayKey: dayKeyFor(statsData?.timeZone),
            xpAwarded: xpConfig.readingComplete,
            gradeStatus: "none",
          });
        }
        return {
          xpAwarded: 0,
          totalXp,
          level,
          leveledUp: false,
          currentStreak,
          newlyUnlocked: [],
          alreadyRecorded: true,
        } satisfies ActivityAwardResponse;
      }

      const xpAwarded = xpConfig.readingComplete;
      const progress = addXp(totalXp, xpAwarded, xpConfig);

      transaction.set(
        chapterDataRef,
        {
          progress: "Complete",
          readingXpAwarded: true,
          completedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      // The dashboard reads XP from userStats, like the MCQ and FRQ routes
      // write it, so a reading's XP has to land there too.
      transaction.set(
        statsRef,
        {
          uid,
          xp: progress.xp,
          level: progress.level,
          xpIntoLevel: progress.xpIntoLevel,
          xpForNextLevel: progress.xpForNextLevel,
          readingsCompleted: FieldValue.increment(1),
          perSubject: {
            [subject]: {
              subjectSlug: subject,
              readingsCompleted: FieldValue.increment(1),
              totalReadings,
              lastActiveAt: FieldValue.serverTimestamp(),
            },
          },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      transaction.create(activityRef, {
        id: activityRef.id,
        userId: uid,
        type: "reading",
        subject,
        unitId,
        sourceId: chapterId,
        label: chapterTitle,
        href,
        occurredAt: FieldValue.serverTimestamp(),
        dayKey: dayKeyFor(statsData?.timeZone),
        xpAwarded,
        gradeStatus: "none",
      });

      return {
        xpAwarded,
        totalXp: progress.xp,
        level: progress.level,
        leveledUp: progress.leveledUp,
        currentStreak,
        newlyUnlocked: [],
        alreadyRecorded: false,
      } satisfies ActivityAwardResponse;
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Unable to record completed reading" },
      { status: 500 },
    );
  }
}
