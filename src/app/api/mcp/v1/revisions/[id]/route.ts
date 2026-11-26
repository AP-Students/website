import { type NextRequest, NextResponse } from "next/server";
import { authenticate, jsonError } from "@/lib/mcpApi";
import { getAdminDb } from "@/lib/mcpAdmin";
import { restoreChapterTables } from "@/lib/chapter-tables";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authenticate(request);
  if (auth instanceof NextResponse) return auth;
  const snap = await getAdminDb().doc(`contentRevisions/${params.id}`).get();
  const revision = snap.data();
  if (!snap.exists || !revision || revision.ownerUid !== auth.uid) return jsonError(404, "REVISION_NOT_FOUND", "Revision not found.");
  return NextResponse.json({ revision: { ...revision, content: restoreChapterTables<unknown>(revision.content), revisionId: params.id } });
}
