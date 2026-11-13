/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { createHash, randomUUID } from "node:crypto";
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
  const requestHash = createHash("sha256").update(JSON.stringify({ content: body.content, reviewedArtifactHash: body.reviewedArtifactHash ?? null })).digest("hex");
  const claimId = createHash("sha256").update(JSON.stringify([auth.uid, params.id, key])).digest("hex");
  const db = getAdminDb();
  const importRef = db.doc(`mcpImports/${params.id}`);
  const claimRef = db.doc(`mcpRevisionIdempotency/${claimId}`);
  const content = source.contentType === "chapter" ? storeChapterTables(body.content) : body.content;
  const result = await db.runTransaction(async (tx) => {
    const [claimSnap, currentImportSnap] = await Promise.all([tx.get(claimRef), tx.get(importRef)]);
    const claim = claimSnap.data();
    if (claim) return claim.requestHash === requestHash
      ? { revisionId: String(claim.revisionId), created: false }
      : { error: "IDEMPOTENCY_CONFLICT" as const };
    const currentImport = currentImportSnap.data();
    if (!currentImportSnap.exists || !currentImport || currentImport.ownerUid !== auth.uid) return { error: "IMPORT_NOT_FOUND" as const };
    const destination = currentImport.state === "published"
      ? { ...currentImport.destination, mode: "update", baseRevisionId: currentImport.publishedRevisionId ?? params.id }
      : currentImport.destination;
    const revision = { revisionId, importId: params.id, ownerUid: auth.uid, contentType: currentImport.contentType, content, metadata: currentImport.metadata, destination, assetBindings: currentImport.assetBindings ?? [], reviewedArtifactHash: body.reviewedArtifactHash ?? null, state: "draft", idempotencyKey: key, createdAt: FieldValue.serverTimestamp() };
    // The key claim, private revision, and latest pointer commit together.
    tx.create(claimRef, { ownerUid: auth.uid, importId: params.id, revisionId, requestHash, createdAt: FieldValue.serverTimestamp() });
    tx.create(db.doc(`contentRevisions/${revisionId}`), revision);
    tx.update(importRef, { latestRevisionId: revisionId, updatedAt: FieldValue.serverTimestamp() });
    return { revisionId, created: true };
  });
  if ("error" in result) return result.error === "IMPORT_NOT_FOUND"
    ? jsonError(404, "IMPORT_NOT_FOUND", "Import not found.")
    : jsonError(409, "IDEMPOTENCY_CONFLICT", "This idempotency key was already used with different content.");
  return NextResponse.json({ revisionId: result.revisionId, state: "draft" }, { status: result.created ? 201 : 200 });
}
