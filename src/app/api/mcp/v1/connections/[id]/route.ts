import { NextRequest, NextResponse } from "next/server";
import { authenticate, jsonError } from "@/lib/mcpApi";
import { getAdminDb } from "@/lib/mcpAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authenticate(request);
  if (auth instanceof NextResponse) return auth;
  const ref = getAdminDb().doc(`mcpConnections/${params.id}`);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.uid !== auth.uid) return jsonError(404, "CONNECTION_NOT_FOUND", "Connection not found.");
  await ref.update({ revokedAt: FieldValue.serverTimestamp() });
  return NextResponse.json({ revoked: true, connectionId: params.id });
}
