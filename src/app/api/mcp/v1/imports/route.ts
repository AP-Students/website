/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { type NextRequest, NextResponse } from "next/server";
import { authenticate, jsonError, requireScopedCourse } from "@/lib/mcpApi";
import { getAdminDb } from "@/lib/mcpAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { validateMcpSchema } from "@/lib/mcpSchema";
import { storeChapterTables, restoreChapterTables } from "@/lib/chapter-tables";
import { destinationError } from "@/lib/mcpDestination";

function upsertListing(items: unknown, entry: Record<string, unknown>, id: string) {
  const list: unknown[] = Array.isArray(items) ? items : [];
  const index = list.findIndex((item) => item && typeof item === "object" && (item as Record<string, unknown>).id === id);
  if (index < 0) return [...list, entry];
  return list.map((item, itemIndex) => itemIndex === index ? { ...(item as Record<string, unknown>), ...entry } : item);
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (auth instanceof NextResponse) return auth;
  const body = await request.json().catch(() => null) as { artifactId?: string; contentType?: string; content?: unknown; metadata?: { title?: string; author?: string }; destination?: { subjectSlug?: string; unitId?: string; contentId?: string | null; baseRevisionId?: string | null; mode?: string }; assetBindings?: unknown[]; sourceMap?: unknown[]; resolutions?: unknown[]; diagnostics?: unknown[]; reviewedArtifactHash?: string } | null;
  const subjectSlug = body?.destination?.subjectSlug;
  const unitId = body?.destination?.unitId;
  if (!subjectSlug || !unitId || !body?.contentType || !body.content || !body.reviewedArtifactHash) return jsonError(422, "INVALID_IMPORT", "contentType, destination, content, and reviewedArtifactHash are required.");
  const scopeError = requireScopedCourse(auth, subjectSlug); if (scopeError) return scopeError;
  const invalidDestination = destinationError(body.destination ?? {});
  if (invalidDestination) return jsonError(422, "INVALID_DESTINATION", invalidDestination);
  if (!['chapter', 'test', 'frq'].includes(body.contentType)) return jsonError(422, "INVALID_CONTENT_TYPE", "contentType must be chapter, test, or frq.");
  const contentRecord = body.content as Record<string, unknown>;
  if (body.contentType === "chapter" && (typeof contentRecord.time !== "number" || typeof contentRecord.version !== "string" || !Array.isArray(contentRecord.blocks))) return jsonError(422, "INVALID_CONTENT", "Chapter content failed independent server validation.");
  if (body.contentType !== "chapter" && (!Array.isArray(contentRecord.questions) || (body.contentType === "test" && typeof contentRecord.time !== "number") || (body.contentType === "frq" && typeof contentRecord.timeLimitMinutes !== "number"))) return jsonError(422, "INVALID_CONTENT", "Assessment content failed independent server validation.");
  const schemaDiagnostics = validateMcpSchema(body.contentType, body.content);
  if (schemaDiagnostics.length) return jsonError(422, "INVALID_CONTENT", "Content failed the canonical JSON schema.", schemaDiagnostics);
  const metadata = { ...body.metadata, title: body.metadata?.title ?? (body.metadata as { chapterTitle?: string } | undefined)?.chapterTitle };
  if (!metadata.title?.trim()) return jsonError(422, "TITLE_REQUIRED", "metadata.title must contain the source title.");
  const storedContent = body.contentType === "chapter" ? storeChapterTables(body.content) : body.content;
  const subject = await getAdminDb().doc(`subjects/${subjectSlug}`).get();
  const unit = await getAdminDb().doc(`subjects/${subjectSlug}/units/${unitId}`).get();
  if (!subject.exists || !unit.exists) return jsonError(404, "DESTINATION_NOT_FOUND", "Only existing courses and units can be imported.");
  const key = request.headers.get("idempotency-key");
  if (!key) return jsonError(400, "IDEMPOTENCY_REQUIRED", "Idempotency-Key is required.");
  const previous = await getAdminDb().collection("mcpImports").where("ownerUid", "==", auth.uid).where("idempotencyKey", "==", key).limit(1).get();
  if (!previous.empty) {
    const existing = previous.docs[0]!;
    const existingData = existing.data();
    if (!isDeepStrictEqual(restoreChapterTables(existingData.content), restoreChapterTables(body.content)) || existingData.contentType !== body.contentType || existingData.reviewedArtifactHash !== body.reviewedArtifactHash) return jsonError(409, "IDEMPOTENCY_CONFLICT", "This idempotency key was already used with different content.");
    let editorUrl: string | null = null;
    const existingDestination = existingData.destination as { subjectSlug?: string; unitId?: string; contentId?: string; mode?: string } | undefined;
    if (existingData.contentType === "chapter" && existingDestination?.subjectSlug && existingDestination.unitId && existingDestination.contentId && existingDestination.mode === "create") {
      const existingSubject = await getAdminDb().doc(`subjects/${existingDestination.subjectSlug}`).get();
      const subjectTitle = existingSubject.data()?.title ?? existingDestination.subjectSlug;
      const title = (existingData.metadata as { title?: string } | undefined)?.title ?? "Untitled";
      editorUrl = `/admin/subject/${existingDestination.subjectSlug}/${existingDestination.unitId}/chapter/${existingDestination.contentId}?subject=${encodeURIComponent(String(subjectTitle))}&chapter=${encodeURIComponent(String(title))}&importId=${existing.id}`;
    }
    return NextResponse.json({ importId: existing.id, state: existingData.state, previewUrl: editorUrl ?? `/admin/imports/${existing.id}`, editorUrl });
  }
  const preparedId = (body as { preparedImportId?: string }).preparedImportId;
  if (preparedId) {
    const prepared = (await getAdminDb().doc(`mcpImports/${preparedId}`).get()).data();
    const preparedDestination = prepared?.destination as { subjectSlug?: string; unitId?: string } | undefined;
    if (!prepared || prepared.ownerUid !== auth.uid || prepared.state !== "staging" || prepared.artifactId !== body.artifactId || preparedDestination?.subjectSlug !== subjectSlug || preparedDestination?.unitId !== unitId) return jsonError(409, "INVALID_PREPARED_IMPORT", "The asset staging job does not match this artifact and destination.");
  }
  const id = preparedId ?? randomUUID();
  const now = FieldValue.serverTimestamp();
  const destination = body.destination;
  const contentId = destination?.contentId ?? (destination?.mode === "update" ? null : randomUUID());
  const normalizedDestination = { subjectSlug, unitId, contentId, baseRevisionId: destination?.baseRevisionId ?? null, mode: destination?.mode ?? "create" };
  const record = { id, ownerUid: auth.uid, artifactId: body.artifactId ?? null, contentType: body.contentType, content: storedContent, metadata, assetBindings: body.assetBindings ?? [], sourceMap: body.sourceMap ?? [], resolutions: body.resolutions ?? [], diagnostics: body.diagnostics ?? [], destination: normalizedDestination, reviewedArtifactHash: body.reviewedArtifactHash ?? null, state: "draft", idempotencyKey: key, createdAt: now, updatedAt: now };

  let editorUrl: string | null = null;
  if (body.contentType === "chapter" && normalizedDestination.mode === "create" && contentId) {
    const subjectRef = getAdminDb().doc(`subjects/${subjectSlug}`);
    const unitRef = getAdminDb().doc(`subjects/${subjectSlug}/units/${unitId}`);
    const chapterRef = getAdminDb().doc(`subjects/${subjectSlug}/units/${unitId}/chapters/${contentId}`);
    const subjectTitle = (await subjectRef.get()).data()?.title ?? subjectSlug;
    try { await getAdminDb().runTransaction(async (tx) => {
      const [subjectSnap, unitSnap, chapterSnap] = await Promise.all([tx.get(subjectRef), tx.get(unitRef), tx.get(chapterRef)]);
      if (!subjectSnap.exists || !unitSnap.exists) throw new Error("DESTINATION_NOT_FOUND");
      if (chapterSnap.exists) throw new Error("CONTENT_ALREADY_EXISTS");
      const metadata = (record.metadata ?? {}) as Record<string, unknown>;
      const listing = { id: contentId, title: metadata.title ?? "Untitled", isPublic: false, revisionManaged: true, currentRevisionId: id };
      const unit = unitSnap.data() ?? {};
      const subject = subjectSnap.data() ?? {};
      const subjectUnits: unknown[] = Array.isArray(subject.units) ? subject.units : [];
      const embeddedIndex = subjectUnits.findIndex((item) => item && typeof item === "object" && (item as Record<string, unknown>).id === unitId);
      if (embeddedIndex < 0) throw new Error("DESTINATION_NOT_FOUND");
      const embeddedUnit = subjectUnits[embeddedIndex] as Record<string, unknown>;
      const nextEmbeddedUnit = { ...embeddedUnit, chapters: upsertListing(embeddedUnit.chapters, listing, contentId) };
      tx.set(getAdminDb().doc(`mcpImports/${id}`), record);
      tx.create(getAdminDb().doc(`contentRevisions/${id}`), { ...record, revisionId: id, immutable: true });
      tx.create(chapterRef, { id: contentId, title: listing.title, author: metadata.author ?? "", data: storedContent, revisionManaged: true, mcpImportId: id, currentRevisionId: id, isPublic: false, createdAt: now, updatedAt: now });
      tx.update(unitRef, { chapters: upsertListing(unit.chapters, listing, contentId), updatedAt: now });
      tx.update(subjectRef, { units: subjectUnits.map((item, index) => index === embeddedIndex ? nextEmbeddedUnit : item), updatedAt: now });
    }); } catch (error) {
      if (error instanceof Error && error.message === "CONTENT_ALREADY_EXISTS") return jsonError(409, "CONTENT_ALREADY_EXISTS", "Create imports cannot replace an existing chapter. Use update mode with its current revision.");
      if (error instanceof Error && error.message === "DESTINATION_NOT_FOUND") return jsonError(404, "DESTINATION_NOT_FOUND", "The destination unit no longer exists.");
      return jsonError(503, "IMPORT_FAILED", "The draft transaction could not be completed.");
    }
    editorUrl = `/admin/subject/${subjectSlug}/${unitId}/chapter/${contentId}?subject=${encodeURIComponent(String(subjectTitle))}&chapter=${encodeURIComponent(String(record.metadata?.title ?? "Untitled"))}&importId=${id}`;
  } else {
    const batch = getAdminDb().batch();
    batch.set(getAdminDb().doc(`mcpImports/${id}`), record);
    batch.create(getAdminDb().doc(`contentRevisions/${id}`), { ...record, revisionId: id, immutable: true });
    await batch.commit();
  }

  return NextResponse.json({ importId: id, state: "draft", previewUrl: editorUrl ?? `/admin/imports/${id}`, editorUrl }, { status: 201 });
}
