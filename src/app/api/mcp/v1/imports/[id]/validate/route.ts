/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { NextRequest, NextResponse } from "next/server";
import { authenticate, jsonError } from "@/lib/mcpApi";
import { getAdminDb } from "@/lib/mcpAdmin";
import { validateMcpSchema } from "@/lib/mcpSchema";

function validateContent(type: string, content: unknown): { code: string; severity: "blocking"; message: string }[] {
  const diagnostics: { code: string; severity: "blocking"; message: string }[] = [];
  if (!content || typeof content !== "object") return [{ code: "INVALID_CONTENT", severity: "blocking", message: "Content must be an object." }];
  const record = content as Record<string, unknown>;
  if (type === "chapter") {
    if (typeof record.time !== "number") diagnostics.push({ code: "INVALID_TIME", severity: "blocking", message: "Chapter time must be numeric." });
    if (typeof record.version !== "string") diagnostics.push({ code: "INVALID_VERSION", severity: "blocking", message: "Chapter version is required." });
    if (!Array.isArray(record.blocks)) diagnostics.push({ code: "INVALID_BLOCKS", severity: "blocking", message: "Chapter blocks must be an array." });
  } else if (!Array.isArray(record.questions)) diagnostics.push({ code: "INVALID_QUESTIONS", severity: "blocking", message: `${type} questions must be an array.` });
  if (Array.isArray(record.questions)) {
    const ids = record.questions.map((question) => question && typeof question === "object" ? (question as Record<string, unknown>).id : undefined).filter(Boolean);
    if (new Set(ids).size !== ids.length) diagnostics.push({ code: "DUPLICATE_QUESTION_ID", severity: "blocking", message: "Question IDs must be unique." });
    if (type === "test" && typeof record.time !== "number") diagnostics.push({ code: "INVALID_TIME", severity: "blocking", message: "Timed tests require numeric time in seconds." });
    if (type === "frq" && typeof record.timeLimitMinutes !== "number") diagnostics.push({ code: "INVALID_TIME_LIMIT", severity: "blocking", message: "Digital FRQs require numeric timeLimitMinutes." });
  }
  return diagnostics;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authenticate(request); if (auth instanceof NextResponse) return auth;
  const ref = getAdminDb().doc(`mcpImports/${params.id}`); const snap = await ref.get(); const data = snap.data();
  if (!snap.exists || !data || data.ownerUid !== auth.uid) return jsonError(404, "IMPORT_NOT_FOUND", "Import not found.");
  const diagnostics = validateContent(data.contentType, data.content);
  diagnostics.push(...validateMcpSchema(data.contentType, data.content));
  await ref.update({ diagnostics, validatedAt: new Date(), state: diagnostics.length ? "needs-attention" : "draft" });
  return NextResponse.json({ valid: diagnostics.length === 0, diagnostics });
}
