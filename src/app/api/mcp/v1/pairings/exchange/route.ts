/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/mcpAdmin";
import { hashSecret, jsonError } from "@/lib/mcpApi";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { pairingId?: string; pairingSecret?: string; codeVerifier?: string } | null;
  if (!body?.pairingId || !body.pairingSecret || !body.codeVerifier) return jsonError(422, "INVALID_PAIRING", "Pairing credentials are required.");
  const ref = getAdminDb().doc(`mcpPairings/${body.pairingId}`); const snap = await ref.get(); const pairing = snap.data();
  if (!pairing || pairing.state !== "approved" || pairing.secretHash !== hashSecret(body.pairingSecret)) return jsonError(409, "PAIRING_PENDING", "Pairing is not approved or is invalid.");
  const expiresAt = pairing.expiresAt instanceof Timestamp ? pairing.expiresAt.toMillis() : new Date(pairing.expiresAt).getTime();
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return jsonError(409, "PAIRING_EXPIRED", "The pairing session has expired.");
  const challenge = createHash("sha256").update(body.codeVerifier).digest("base64url");
  if (challenge !== pairing.codeChallenge) return jsonError(409, "PKCE_INVALID", "The pairing verifier does not match the original request.");
  const connectionSecret = randomBytes(32).toString("base64url"); const connectionId = randomBytes(16).toString("hex");
  await getAdminDb().doc(`mcpConnections/${connectionId}`).set({ uid: pairing.uid, secretHash: hashSecret(connectionSecret), label: pairing.label, allowedSubjectSlugs: pairing.allowedSubjectSlugs, expiresAt: Timestamp.fromMillis(Date.now() + 30 * 86400_000), createdAt: FieldValue.serverTimestamp() });
  await ref.update({ state: "consumed", consumedAt: FieldValue.serverTimestamp() });
  return NextResponse.json({ connectionId, connectionSecret, expiresInSeconds: 30 * 86400 });
}
