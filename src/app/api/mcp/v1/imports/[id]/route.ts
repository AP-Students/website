import { type NextRequest, NextResponse } from "next/server";
import { authenticate, jsonError } from "@/lib/mcpApi";
import { getAdminDb } from "@/lib/mcpAdmin";
import { restoreChapterTables } from "@/lib/chapter-tables";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authenticate(request); if (auth instanceof NextResponse) return auth;
  const snap = await getAdminDb().doc(`mcpImports/${params.id}`).get(); const data = snap.data();
  if (!snap.exists || !data || data.ownerUid !== auth.uid) return jsonError(404, "IMPORT_NOT_FOUND", "Import not found.");
  let editorUrl: string | null = null;
  const destination = data.destination as { subjectSlug?: string; unitId?: string; contentId?: string; mode?: string } | undefined;
  if (data.contentType === "chapter" && destination?.subjectSlug && destination.unitId && destination.contentId && destination.mode === "create") {
    const subject = await getAdminDb().doc(`subjects/${destination.subjectSlug}`).get();
    const subjectTitle: unknown = subject.data()?.title ?? destination.subjectSlug;
    const title = (data.metadata as { title?: string } | undefined)?.title ?? "Untitled";
    editorUrl = `/admin/subject/${destination.subjectSlug}/${destination.unitId}/chapter/${destination.contentId}?subject=${encodeURIComponent(String(subjectTitle))}&chapter=${encodeURIComponent(String(title))}&importId=${params.id}`;
  }
  return NextResponse.json({ import: { ...data, content: restoreChapterTables<unknown>(data.content), id: params.id, editorUrl, previewUrl: editorUrl ?? `/admin/imports/${params.id}` } });
}
