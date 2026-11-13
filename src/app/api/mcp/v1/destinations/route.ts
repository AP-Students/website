import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/mcpApi";
import { getAdminDb } from "@/lib/mcpAdmin";

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (auth instanceof NextResponse) return auth;
  const snapshot = await getAdminDb().collection("subjects").get();
  const destinations = snapshot.docs.filter((doc) => {
    const allowed = auth.connection.allowedSubjectSlugs as string[] | undefined;
    return !allowed || allowed.includes(doc.id);
  }).map((doc) => {
    const data = doc.data() as { title?: string; units?: Array<Record<string, unknown>> };
    return { id: doc.id, title: data.title ?? doc.id, units: (data.units ?? []).map((unit) => ({ id: unit.id, title: unit.title, chapters: unit.chapters ?? [], tests: unit.tests ?? [], frqs: unit.frqs ?? [] })), currentRevisionToken: doc.updateTime?.toDate().toISOString() ?? null };
  });
  return NextResponse.json({ destinations });
}
