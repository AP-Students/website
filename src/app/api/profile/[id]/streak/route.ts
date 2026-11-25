import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  readStreakState,
  resolveActivityDay,
  streakAsOf,
} from "@/lib/gamification/streak";
import { isDocumentId, requireUser } from "@/lib/server/activityRequest";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  if (!isDocumentId(params.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const db = getAdminDb();
  const [profile, stats] = await Promise.all([
    db.doc(`profiles/${params.id}`).get(),
    db.doc(`userStats/${params.id}`).get(),
  ]);
  if (!profile.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (profile.data()?.isPublic !== true) {
    // Same as the rules: the owner and their friends can still see it.
    const caller = request.headers.get("authorization")
      ? await requireUser(request)
      : null;
    const viewer = caller && "uid" in caller ? caller.uid : null;
    const allowed =
      viewer !== null &&
      (viewer === params.id ||
        (await db.doc(`users/${params.id}/friends/${viewer}`).get()).exists);
    if (!allowed) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }
  const data = stats.data();
  const { day } = resolveActivityDay(
    new Date(),
    data?.timeZone,
    data?.timeZone,
  );
  return NextResponse.json({
    currentStreak: streakAsOf(readStreakState(data), day),
  });
}
