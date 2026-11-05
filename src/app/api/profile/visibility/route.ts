import { NextResponse, type NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/server/activityRequest";
import { buildPublicProfile } from "@/lib/server/publicProfile";

export async function DELETE(request: NextRequest) {
  const caller = await requireUser(request);
  if ("error" in caller) return caller.error;

  try {
    await getAdminDb().doc(`profiles/${caller.uid}`).delete();
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Unable to delete public profile", error);
    return NextResponse.json(
      { error: "Unable to delete public profile" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const caller = await requireUser(request);
  if ("error" in caller) return caller.error;

  const body = (await request.json().catch(() => null)) as {
    isPublic?: unknown;
  } | null;
  if (
    !body ||
    (body.isPublic !== undefined && typeof body.isPublic !== "boolean")
  ) {
    return NextResponse.json(
      { error: "isPublic must be a boolean when provided" },
      { status: 400 },
    );
  }

  const db = getAdminDb();
  const uid = caller.uid;
  const profileRef = db.doc(`profiles/${uid}`);
  const statsRef = db.doc(`userStats/${uid}`);
  const userRef = db.doc(`users/${uid}`);
  const achievementsQuery = db.collection(`users/${uid}/achievements`);

  try {
    const profile = await db.runTransaction(async (transaction) => {
      const [snapshots, achievements] = await Promise.all([
        transaction.getAll(profileRef, statsRef, userRef),
        transaction.get(achievementsQuery),
      ]);
      const [current, stats, user] = snapshots;
      if (!user?.exists) {
        throw new Error("USER_PROFILE_NOT_FOUND");
      }

      const publicProfile = buildPublicProfile(
        uid,
        user.data() as Record<string, unknown>,
        stats?.data() as Record<string, unknown> | undefined,
        achievements.docs.map((doc) => ({
          id: doc.id,
          title: String(doc.data().title ?? doc.id),
        })),
        typeof body.isPublic === "boolean"
          ? body.isPublic
          : currentProfileIsPublic(current?.data()),
      );
      transaction.set(profileRef, publicProfile);
      return publicProfile;
    });

    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof Error && error.message === "USER_PROFILE_NOT_FOUND") {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }
    console.error("Unable to update public profile visibility", error);
    return NextResponse.json(
      { error: "Unable to update profile visibility" },
      { status: 500 },
    );
  }
}

function currentProfileIsPublic(
  profile: Record<string, unknown> | undefined,
): boolean {
  return profile?.isPublic === true;
}
