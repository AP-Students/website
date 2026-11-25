import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  readStreakState,
  resolveActivityDay,
  streakAsOf,
} from "@/lib/gamification/streak";
import { isDocumentId } from "@/lib/server/activityRequest";

export async function GET(
  _request: Request,
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
  if (profile.data()?.isPublic !== true) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
