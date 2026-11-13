/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/mcpAdmin";
import { hashSecret, jsonError } from "@/lib/mcpApi";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { pairingId?: string; pairingSecret?: string; codeVerifier?: string } | null;
  if (!body?.pairingId || !body.pairingSecret || !body.codeVerifier) return jsonError(422, "INVALID_PAIRING", "Pairing credentials are required.");
  const { pairingId, pairingSecret, codeVerifier } = body;
  const challenge = createHash("sha256").update(codeVerifier).digest("base64url");
  const connectionSecret = randomBytes(32).toString("base64url"); const connectionId = randomBytes(16).toString("hex");
  const db = getAdminDb();
  const ref = db.doc(`mcpPairings/${pairingId}`);
  const result = await db.runTransaction(async (tx) => {
    const pairing = (await tx.get(ref)).data();
    if (!pairing || pairing.state !== "approved" || pairing.secretHash !== hashSecret(pairingSecret)) return "PAIRING_PENDING";
    const expiresAt = pairing.expiresAt instanceof Timestamp ? pairing.expiresAt.toMillis() : new Date(pairing.expiresAt).getTime();
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return "PAIRING_EXPIRED";
    if (challenge !== pairing.codeChallenge) return "PKCE_INVALID";
    tx.create(db.doc(`mcpConnections/${connectionId}`), { uid: pairing.uid, secretHash: hashSecret(connectionSecret), label: pairing.label, allowedSubjectSlugs: pairing.allowedSubjectSlugs, expiresAt: Timestamp.fromMillis(Date.now() + 30 * 86400_000), createdAt: FieldValue.serverTimestamp() });
    tx.update(ref, { state: "consumed", consumedAt: FieldValue.serverTimestamp() });
    return "OK";
  });
  if (result === "PAIRING_PENDING") return jsonError(409, result, "Pairing is not approved or is invalid.");
  if (result === "PAIRING_EXPIRED") return jsonError(409, result, "The pairing session has expired.");
  if (result === "PKCE_INVALID") return jsonError(409, result, "The pairing verifier does not match the original request.");
  return NextResponse.json({ connectionId, connectionSecret, expiresInSeconds: 30 * 86400 });
}
