import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { authenticate, jsonError, requireScopedCourse } from "@/lib/mcpApi";
import { getAdminDb } from "@/lib/mcpAdmin";

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (auth instanceof NextResponse) return auth;
  const body = await request.json() as { artifactId?: string; destination?: { subjectSlug?: string; unitId?: string } };
  const destination = body.destination;
  if (!body.artifactId || !destination?.subjectSlug || !destination.unitId) return jsonError(422, "DESTINATION_REQUIRED", "Artifact and existing destination are required.");
  const denied = requireScopedCourse(auth, destination.subjectSlug);
  if (denied) return denied;
  const unit = await getAdminDb().doc(`subjects/${destination.subjectSlug}/units/${destination.unitId}`).get();
  if (!unit.exists) return jsonError(404, "DESTINATION_NOT_FOUND", "Destination unit does not exist.");
  const id = randomUUID();
  await getAdminDb().doc(`mcpImports/${id}`).set({ id, artifactId: body.artifactId, ownerUid: auth.uid, destination, state: "staging", createdAt: new Date() });
  return NextResponse.json({ importId: id, state: "staging" }, { status: 201 });
}
