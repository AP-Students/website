/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { randomUUID } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { authenticate, jsonError, requireScopedCourse } from "@/lib/mcpApi";
import { getAdminDb } from "@/lib/mcpAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { validateMcpSchema } from "@/lib/mcpSchema";
import { storeChapterTables } from "@/lib/chapter-tables";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authenticate(request);
  if (auth instanceof NextResponse) return auth;
  const key = request.headers.get("idempotency-key");
  if (!key) return jsonError(400, "IDEMPOTENCY_REQUIRED", "Idempotency-Key is required for revision creation.");
  const importSnap = await getAdminDb().doc(`mcpImports/${params.id}`).get();
  const source = importSnap.data();
  if (!importSnap.exists || !source || source.ownerUid !== auth.uid) return jsonError(404, "IMPORT_NOT_FOUND", "Import not found.");
  const sourceDestination = source.destination as { subjectSlug?: unknown } | undefined;
  if (typeof sourceDestination?.subjectSlug !== "string") return jsonError(422, "INVALID_DESTINATION", "The import must reference a course.");
  const denied = requireScopedCourse(auth, sourceDestination.subjectSlug);
  if (denied) return denied;
  const body = await request.json().catch(() => null) as { content?: unknown; reviewedArtifactHash?: string } | null;
  if (!body || body.content === undefined) return jsonError(422, "INVALID_REVISION", "Revision content is required.");
  const schemaDiagnostics = validateMcpSchema(String(source.contentType), body.content);
  if (schemaDiagnostics.length) return jsonError(422, "INVALID_REVISION", "Revision content failed the canonical JSON schema.", schemaDiagnostics);
  const revisionId = randomUUID();
  const content = source.contentType === "chapter" ? storeChapterTables(body.content) : body.content;
  const destination = source.state === "published"
    ? { ...source.destination, mode: "update", baseRevisionId: source.publishedRevisionId ?? params.id }
    : source.destination;
  const revision = { revisionId, importId: params.id, ownerUid: auth.uid, contentType: source.contentType, content, metadata: source.metadata, destination, assetBindings: source.assetBindings ?? [], reviewedArtifactHash: body.reviewedArtifactHash ?? null, state: "draft", idempotencyKey: key, createdAt: FieldValue.serverTimestamp() };
  // Draft saves only write private revision records, never the live document.
  const batch = getAdminDb().batch();
  batch.create(getAdminDb().doc(`contentRevisions/${revisionId}`), revision);
  batch.update(getAdminDb().doc(`mcpImports/${params.id}`), { latestRevisionId: revisionId, updatedAt: FieldValue.serverTimestamp() });
  await batch.commit();
  return NextResponse.json({ revisionId, state: "draft" }, { status: 201 });
}
