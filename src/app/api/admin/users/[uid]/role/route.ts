import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

const allowedRoles = new Set(["member", "grader", "user", "banned"]);

const getBearerToken = (request: NextRequest): string | null => {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7).trim();
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: { uid: string } },
) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json({ error: "Missing auth token." }, { status: 401 });
    }

    const decodedToken = await adminAuth().verifyIdToken(token);
    const callerUid = decodedToken.uid;

    const callerRef = adminDb().collection("users").doc(callerUid);
    const callerSnap = await callerRef.get();
    if (!callerSnap.exists || callerSnap.get("access") !== "admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const body = (await request.json()) as { newRole?: string };
    const newRole = body.newRole;
    if (!newRole || !allowedRoles.has(newRole)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    const targetUid = params.uid;
    if (!targetUid) {
      return NextResponse.json({ error: "Missing target user id." }, { status: 400 });
    }

    const targetRef = adminDb().collection("users").doc(targetUid);
    const targetSnap = await targetRef.get();
    if (!targetSnap.exists) {
      return NextResponse.json({ error: "Target user not found." }, { status: 404 });
    }

    await targetRef.update({ access: newRole });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to update role via admin API", error);
    return NextResponse.json({ error: "Failed to update role." }, { status: 500 });
  }
}
