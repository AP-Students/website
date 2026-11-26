/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/mcpAdmin";
import { jsonError } from "@/lib/mcpApi";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return jsonError(401, "MISSING_AUTH", "Firebase authentication is required.");
  const body = await request.json().catch(() => null) as { pairingId?: string; userCode?: string; subjectSlugs?: string[] } | null;
  if (!body?.pairingId || !body.userCode || !Array.isArray(body.subjectSlugs)) return jsonError(422, "INVALID_PAIRING", "pairingId, userCode, and subjectSlugs are required.");
  let uid: string;
  try { uid = (await getAdminAuth().verifyIdToken(header.slice(7))).uid; } catch { return jsonError(401, "INVALID_AUTH", "The Firebase ID token is invalid or expired."); }
  const user = (await getAdminDb().doc(`users/${uid}`).get()).data();
  if (!user || !["admin", "member"].includes(user.access)) return jsonError(403, "ROLE_REQUIRED", "Member or admin access is required.");
  const ref = getAdminDb().doc(`mcpPairings/${body.pairingId}`);
  const pairingSnap = await ref.get(); const pairing = pairingSnap.data();
  if (!pairing || pairing.state !== "pending" || pairing.expiresAt.toMillis() < Date.now()) return jsonError(409, "PAIRING_EXPIRED", "This pairing has expired.");
  if (body.userCode.trim().toUpperCase() !== pairing.userCode) return jsonError(409, "PAIRING_CODE_INVALID", "The pairing code does not match the request.");
  const courseDocs = await Promise.all(body.subjectSlugs.map((slug) => getAdminDb().doc(`subjects/${slug}`).get()));
  if (courseDocs.some((doc) => !doc.exists)) return jsonError(404, "COURSE_NOT_FOUND", "Every selected course must already exist.");
  await ref.update({ state: "approved", uid, allowedSubjectSlugs: body.subjectSlugs, approvedAt: FieldValue.serverTimestamp() });
  return NextResponse.json({ approved: true });
}
