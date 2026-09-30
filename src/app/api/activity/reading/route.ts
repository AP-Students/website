import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import type { ActivityAwardResponse } from "@/types/dashboard";

const READING_XP = 10;

const isDocumentId = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0 && !value.includes("/");

const nonNegativeNumber = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : fallback;

/** Records a completed chapter and awards its one-time 10 XP reading bonus. */
export async function POST(request: NextRequest) {
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

  const chapterRef = adminDb
    .collection("subjects")
    .doc(subject)
    .collection("units")
    .doc(unitId)
    .collection("chapters")
    .doc(chapterId);
  if (!(await chapterRef.get()).exists) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  try {
    const result = await adminDb.runTransaction(async (transaction) => {
      const userRef = adminDb.collection("users").doc(uid);
      const chapterDataRef = userRef.collection("chapterData").doc(chapterId);
      const [user, chapterData] = await transaction.getAll(
        userRef,
        chapterDataRef,
      );
      const userData = user.data();
      const totalXp = nonNegativeNumber(userData?.xp, 0);
      const level = nonNegativeNumber(userData?.level, 1);
      const currentStreak = nonNegativeNumber(userData?.currentStreak, 0);

      if (chapterData.data()?.readingXpAwarded === true) {
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

      transaction.set(
        chapterDataRef,
        {
          progress: "Complete",
          readingXpAwarded: true,
          completedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      transaction.update(userRef, { xp: FieldValue.increment(READING_XP) });

      return {
        xpAwarded: READING_XP,
        totalXp: totalXp + READING_XP,
        level,
        leveledUp: false,
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
