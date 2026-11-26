/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "./mcpAdmin";
import type { DocumentData } from "firebase-admin/firestore";

export const jsonError = (status: number, code: string, message: string, details?: unknown) =>
  NextResponse.json({ error: { code, message, retryable: status >= 500, details }, requestId: randomBytes(8).toString("hex") }, { status });

export function hashSecret(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function epochMillis(value: unknown): number | null {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (value && typeof value === "object" && "toMillis" in value && typeof (value as { toMillis?: unknown }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  return null;
}

async function verifyBearer(request: NextRequest): Promise<{ uid: string; access: string; connection: DocumentData } | NextResponse> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return jsonError(401, "MISSING_AUTH", "Bearer authentication is required.");
  const token = header.slice(7);
  let decoded: { uid: string };
  try { decoded = await getAdminAuth().verifyIdToken(token); } catch { return jsonError(401, "INVALID_AUTH", "The Firebase ID token is invalid or expired."); }
  const user = (await getAdminDb().doc(`users/${decoded.uid}`).get()).data();
  if (!user || !["admin", "member"].includes(user.access)) return jsonError(403, "ROLE_REQUIRED", "Member or admin access is required.");
  return { uid: decoded.uid, access: user.access, connection: {} };
}

export async function authenticate(request: NextRequest): Promise<{ uid: string; access: string; connection: DocumentData } | NextResponse> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return jsonError(401, "MISSING_AUTH", "Bearer authentication is required.");
  const value = header.slice(7);
  const connectionId = request.headers.get("x-fivehive-connection-id");
  if (connectionId) {
    const connection = (await getAdminDb().doc(`mcpConnections/${connectionId}`).get()).data();
    const expiresAt = epochMillis(connection?.expiresAt);
    if (!connection || connection.revokedAt || (expiresAt !== null && expiresAt <= Date.now())) return jsonError(401, "CONNECTION_INVALID", "The MCP connection is revoked or expired.");
    if (hashSecret(value) !== connection.secretHash) return jsonError(401, "CONNECTION_INVALID", "The MCP connection secret is invalid.");
    const user = (await getAdminDb().doc(`users/${connection.uid}`).get()).data();
    if (!user || !["admin", "member"].includes(user.access)) return jsonError(403, "ROLE_REQUIRED", "Member or admin access is required.");
    return { uid: connection.uid, access: user.access, connection };
  }
  return verifyBearer(request);
}

export function requireScopedCourse(auth: { connection: DocumentData }, subjectSlug: string): NextResponse | null {
  const allowed = auth.connection.allowedSubjectSlugs as string[] | undefined;
  if (allowed && !allowed.includes(subjectSlug)) return jsonError(403, "COURSE_SCOPE", "This connection is not authorized for the requested course.");
  return null;
}
