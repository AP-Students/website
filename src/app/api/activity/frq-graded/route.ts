import { NextResponse, type NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { loadXpConfig } from "@/lib/gamification/loadXpConfig";
import { isDocumentId, requireUser } from "@/lib/server/activityRequest";
import { awardFrqGrade, FrqGradeAwardError } from "@/lib/server/awardFrqGrade";

/** Request supplies only the saved result's ID; score and owner come from DB. */
export async function POST(request: NextRequest) {
  const caller = await requireUser(request);
  if ("error" in caller) return caller.error;
  const body = (await request.json().catch(() => null)) as {
    submissionId?: unknown;
  } | null;
  if (!isDocumentId(body?.submissionId)) {
    return NextResponse.json(
      { error: "submissionId must be a valid document ID" },
      { status: 400 },
    );
  }

  try {
    const result = await awardFrqGrade(
      getAdminDb(),
      caller.uid,
      body.submissionId,
      await loadXpConfig(),
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof FrqGradeAwardError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Unable to award FRQ grade XP", error);
    return NextResponse.json(
      { error: "Unable to award FRQ grade XP" },
      { status: 500 },
    );
  }
}
