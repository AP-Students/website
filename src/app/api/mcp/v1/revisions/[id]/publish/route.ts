/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/prefer-nullish-coalescing */
import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { authenticate, jsonError, requireScopedCourse } from "@/lib/mcpApi";
import { getAdminDb } from "@/lib/mcpAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { storeChapterTables, restoreChapterTables } from "@/lib/chapter-tables";
import { contentCollection, destinationError } from "@/lib/mcpDestination";
import { validateMcpSchema } from "@/lib/mcpSchema";

function newContentId() { return randomBytes(8).toString("hex"); }

function upsertListing(items: unknown, entry: Record<string, unknown>, id: string) {
  const list = Array.isArray(items) ? items : [];
  const index = list.findIndex((item) => item && typeof item === "object" && (item as Record<string, unknown>).id === id);
  if (index < 0) return [...list, entry];
  return list.map((item, i) => i === index ? { ...(item as Record<string, unknown>), ...entry } : item);
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authenticate(request); if (auth instanceof NextResponse) return auth;
  if (!request.headers.get("idempotency-key")) return jsonError(400, "IDEMPOTENCY_REQUIRED", "Idempotency-Key is required for publication.");
  const revision = await getAdminDb().doc(`contentRevisions/${params.id}`).get();
  const data = revision.data(); if (!revision.exists || !data || data.ownerUid !== auth.uid) return jsonError(404, "REVISION_NOT_FOUND", "Revision not found.");
  const scopeError = requireScopedCourse(auth, data.destination.subjectSlug); if (scopeError) return scopeError;
  const invalidDestination = destinationError(data.destination);
  if (invalidDestination) return jsonError(422, "INVALID_DESTINATION", invalidDestination);
  if (data.state === "published") return NextResponse.json({ revisionId: params.id, contentId: data.contentId, livePath: data.livePath, state: "published" });
  if (data.state !== "draft") return jsonError(409, "REVISION_STATE", "Only draft revisions can be published.");
  const body = await request.json().catch(() => ({})) as { expectedRevisionHash?: string; idempotencyKey?: string };
  if (body.expectedRevisionHash !== undefined && data.reviewedArtifactHash !== body.expectedRevisionHash) return jsonError(409, "REVISION_CONFLICT", "The requested revision does not match the supplied version.");
  const subjectSlug = data.destination.subjectSlug as string;
  const unitId = data.destination.unitId as string;
  const contentType = data.contentType as string;
  const content = (data.content ?? {}) as Record<string, unknown>;
  const collection = contentCollection(contentType);
  if (!collection) return jsonError(422, "INVALID_CONTENT_TYPE", "The revision has an unsupported content type.");
  const diagnostics = validateMcpSchema(contentType, restoreChapterTables(content));
  if (diagnostics.length) return jsonError(422, "INVALID_CONTENT", "The revision content failed validation.", diagnostics);
  const importId = String(data.importId ?? data.id ?? params.id);
  const contentId = (data.destination.contentId as string | null) || newContentId();
  const livePath = `subjects/${subjectSlug}/units/${unitId}/${collection}/${contentId}`;
  const subjectRef = getAdminDb().doc(`subjects/${subjectSlug}`);
  const unitRef = getAdminDb().doc(`subjects/${subjectSlug}/units/${unitId}`);
  const liveRef = getAdminDb().doc(livePath);
  const importRef = getAdminDb().doc(`mcpImports/${importId}`);
  const revisionRef = getAdminDb().doc(`contentRevisions/${params.id}`);
  let transactionError: unknown = null;
  try { await getAdminDb().runTransaction(async (tx) => {
    const [subjectSnap, unitSnap, liveSnap, importSnap, currentRevision] = await Promise.all([tx.get(subjectRef), tx.get(unitRef), tx.get(liveRef), tx.get(importRef), tx.get(revisionRef)]);
    if (!subjectSnap.exists || !unitSnap.exists) throw new Error("DESTINATION_NOT_FOUND");
    if (!importSnap.exists || importSnap.data()?.ownerUid !== auth.uid) throw new Error("IMPORT_NOT_FOUND");
    if (currentRevision.data()?.state === "published") return;
    if (currentRevision.data()?.state !== "draft") throw new Error("REVISION_CONFLICT");
    if (data.destination.mode === "update" && (!liveSnap.exists || liveSnap.data()?.currentRevisionId !== data.destination.baseRevisionId)) throw new Error("REVISION_CONFLICT");
    if (data.destination.mode !== "update" && liveSnap.exists && !(liveSnap.data()?.mcpImportId === importId && liveSnap.data()?.isPublic === false)) throw new Error("CONTENT_ALREADY_EXISTS");
    const now = FieldValue.serverTimestamp();
    const metadata = (data.metadata ?? {}) as Record<string, unknown>;
    const common = { id: contentId, title: metadata.title ?? content.title ?? "Untitled", author: metadata.author ?? "", revisionManaged: true, mcpImportId: importId, currentRevisionId: params.id, isPublic: true, createdAt: liveSnap.data()?.createdAt ?? now, updatedAt: now };
    const liveContent = contentType === "chapter" ? { ...common, data: storeChapterTables(content) } : { ...content, ...common };
    tx.set(liveRef, liveContent, { merge: false });
    const unit = unitSnap.data() ?? {};
    const listing = { id: contentId, title: common.title, isPublic: true, currentRevisionId: params.id };
    const field = contentType === "chapter" ? "chapters" : contentType === "test" ? "tests" : "frqs";
    tx.update(unitRef, { [field]: upsertListing(unit[field], listing, contentId), updatedAt: now });
    const subject = subjectSnap.data() ?? {};
    const subjectUnits = Array.isArray(subject.units) ? subject.units : [];
    const embeddedIndex = subjectUnits.findIndex((item) => item && typeof item === "object" && (item as Record<string, unknown>).id === unitId);
    if (embeddedIndex < 0) throw new Error("DESTINATION_NOT_FOUND");
    const embeddedUnit = subjectUnits[embeddedIndex] as Record<string, unknown>;
    const nextEmbeddedUnit = { ...embeddedUnit, [field]: upsertListing(embeddedUnit[field], listing, contentId) };
    const nextSubjectUnits = subjectUnits.map((item, index) => index === embeddedIndex ? nextEmbeddedUnit : item);
    tx.update(subjectRef, { units: nextSubjectUnits, updatedAt: now });
    tx.update(importRef, { state: "published", publishedRevisionId: params.id, contentId, livePath, publishedBy: auth.uid, publishedAt: now, updatedAt: now });
    tx.set(revisionRef, { state: "published", contentId, livePath, publishedBy: auth.uid, publishedAt: now }, { merge: true });
  }); } catch (error) { transactionError = error; }
  if (transactionError instanceof Error && transactionError.message === "REVISION_CONFLICT") return jsonError(409, "REVISION_CONFLICT", "The destination changed after this import began.");
  if (transactionError instanceof Error && transactionError.message === "CONTENT_ALREADY_EXISTS") return jsonError(409, "CONTENT_ALREADY_EXISTS", "Create imports cannot replace existing content.");
  if (transactionError instanceof Error && transactionError.message === "IMPORT_NOT_FOUND") return jsonError(404, "IMPORT_NOT_FOUND", "The owning import was not found.");
  if (transactionError instanceof Error && transactionError.message === "DESTINATION_NOT_FOUND") return jsonError(404, "DESTINATION_NOT_FOUND", "The destination unit no longer exists.");
  if (transactionError) return jsonError(503, "PUBLICATION_FAILED", "The publication transaction could not be completed.");
  return NextResponse.json({ revisionId: params.id, contentId, livePath, state: "published", publicUrl: `/subject/${subjectSlug}/unit-${unitId}/${contentType}/${contentId}` });
}
