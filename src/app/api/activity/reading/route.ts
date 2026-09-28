import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

const READING_XP = 10;

const isDocumentId = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0 && !value.includes("/");

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
      const totalXp = (user.data()?.xp as number | undefined) ?? 0;

      if (chapterData.data()?.readingXpAwarded === true) {
        return { xpAwarded: 0, totalXp, alreadyRecorded: true };
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
        alreadyRecorded: false,
      };
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Unable to record completed reading" },
      { status: 500 },
    );
  }
}
