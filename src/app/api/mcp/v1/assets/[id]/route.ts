/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { NextRequest, NextResponse } from "next/server";
import { authenticate, jsonError, requireScopedCourse } from "@/lib/mcpApi";
import { getAdminDb, getAdminStorage } from "@/lib/mcpAdmin";
import { publishedContentPath } from "@/lib/mcpDestination";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const revisionId = request.nextUrl.searchParams.get("revisionId");
  if (!revisionId) return jsonError(422, "REVISION_REQUIRED", "revisionId is required for asset access.");
  const revision = (await getAdminDb().doc(`contentRevisions/${revisionId}`).get()).data();
  if (!revision) return jsonError(404, "REVISION_NOT_FOUND", "Revision not found.");
  const bindings = revision.assetBindings as Array<{ assetId?: string }> | undefined;
  if (!bindings?.some((binding) => binding.assetId === params.id)) return jsonError(403, "ASSET_FORBIDDEN", "The revision does not reference this image.");
  const destination = revision.destination as { subjectSlug: string; unitId: string; contentId: string };
  const livePath = publishedContentPath(revision.contentType, destination);
  const live = livePath
    ? (await getAdminDb().doc(livePath).get()).data()
    : undefined;
  const publicRevision = revision.state === "published" && live?.isPublic === true && live.currentRevisionId === revisionId;
  if (!publicRevision) {
    const auth = await authenticate(request);
    if (auth instanceof NextResponse) return auth;
    if (revision.ownerUid !== auth.uid && auth.access !== "admin") return jsonError(403, "ASSET_FORBIDDEN", "The private revision is not accessible.");
    const denied = requireScopedCourse(auth, destination.subjectSlug);
    if (denied) return denied;
  }
  const importId = String(revision.importId ?? revision.id ?? revisionId);
  const asset = (await getAdminDb().doc(`contentAssets/${importId}_${params.id}`).get()).data();
  if (!asset || asset.ownerUid !== revision.ownerUid) return jsonError(404, "ASSET_NOT_FOUND", "Image not found.");
  const [bytes] = await getAdminStorage().bucket().file(asset.path).download();
  const headers: Record<string, string> = { "Content-Type": asset.contentType, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  if (asset.contentType === "image/svg+xml") {
    headers["Content-Disposition"] = "attachment";
    headers["Content-Security-Policy"] = "sandbox; default-src 'none'";
  }
  return new NextResponse(bytes as unknown as BodyInit, { headers });
}
