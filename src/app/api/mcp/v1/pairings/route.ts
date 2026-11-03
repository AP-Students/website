import { randomBytes, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/mcpAdmin";
import { jsonError, hashSecret } from "@/lib/mcpApi";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as { codeChallenge?: string; label?: string };
  if (!body.codeChallenge || body.codeChallenge.length < 20) return jsonError(422, "INVALID_PKCE", "A PKCE code challenge is required.");
  const id = randomUUID();
  const secret = randomBytes(32).toString("base64url");
  const userCode = randomBytes(4).toString("hex").toUpperCase();
  try {
    await getAdminDb().doc(`mcpPairings/${id}`).set({ id, secretHash: hashSecret(secret), userCode, codeChallenge: body.codeChallenge, label: body.label ?? "FiveHive MCP", state: "pending", expiresAt: Timestamp.fromMillis(Date.now() + 5 * 60_000), createdAt: FieldValue.serverTimestamp() });
  } catch (error) {
    console.error("MCP pairing backend unavailable", error instanceof Error ? error.message : "unknown error");
    return jsonError(503, "BACKEND_UNAVAILABLE", "Firebase Admin credentials or the configured Firestore backend are unavailable.");
  }
  const origin = request.nextUrl.origin;
  return NextResponse.json({ pairingId: id, userCode, pairingSecret: secret, verificationUrl: `${origin}/admin/mcp/connect?pairingId=${encodeURIComponent(id)}&userCode=${encodeURIComponent(userCode)}`, expiresInSeconds: 300 }, { status: 201 });
}
