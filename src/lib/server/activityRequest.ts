import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";

/**
 * Request checks shared by the /api/activity routes, so each route reads the
 * caller and its ids the same way.
 */

/** A usable Firestore document id: non-empty and a single path segment. */
export const isDocumentId = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0 && !value.includes("/");

/**
 * The signed-in student behind a request, from its
 * `Authorization: Bearer <Firebase ID token>` header, or the 401 to return.
 *
 *     const caller = await requireUser(request);
 *     if ("error" in caller) return caller.error;
 */
export async function requireUser(
  request: Request,
): Promise<{ uid: string } | { error: NextResponse }> {
  const idToken = request.headers
    .get("authorization")
    ?.match(/^Bearer (.+)$/i)?.[1];
  if (!idToken) {
    return {
      error: NextResponse.json(
        { error: "Missing authorization token" },
        { status: 401 },
      ),
    };
  }

  try {
    return { uid: (await getAdminAuth().verifyIdToken(idToken)).uid };
  } catch (error) {
    console.error("Unable to verify activity token", error);
    return {
      error: NextResponse.json(
        { error: "Invalid authorization token" },
        { status: 401 },
      ),
    };
  }
}
