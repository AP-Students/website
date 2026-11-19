/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/mcpApi";
import { getAdminDb } from "@/lib/mcpAdmin";

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (auth instanceof NextResponse) return auth;
  const snapshot = await getAdminDb().collection("mcpConnections").where("uid", "==", auth.uid).get();
  return NextResponse.json({ connections: snapshot.docs.map((doc) => { const data = doc.data(); return { id: doc.id, label: data.label ?? null, allowedSubjectSlugs: data.allowedSubjectSlugs ?? [], expiresAt: data.expiresAt?.toDate?.()?.toISOString?.() ?? null, revoked: Boolean(data.revokedAt) }; }) });
}
