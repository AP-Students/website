import { NextResponse, type NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { isDocumentId, requireUser } from "@/lib/server/activityRequest";
import {
  cancelFriendRequest,
  FriendError,
  removeFriend,
  respondToFriendRequest,
  sendFriendRequest,
} from "@/lib/server/friends";

type Body = { action?: unknown; username?: unknown; uid?: unknown } | null;

// One endpoint for every friend action:
//   { action: "request", username }  send a request
//   { action: "accept" | "decline", uid }  answer a request from uid
//   { action: "cancel", uid }  take back a request you sent to uid
//   { action: "remove", uid }  unfriend uid
export async function POST(request: NextRequest) {
  const caller = await requireUser(request);
  if ("error" in caller) return caller.error;
  const body = (await request.json().catch(() => null)) as Body;
  const db = getAdminDb();

  try {
    if (body?.action === "request" && typeof body.username === "string") {
      return NextResponse.json(
        await sendFriendRequest(db, caller.uid, body.username),
      );
    }
    if (isDocumentId(body?.uid) && body.uid !== caller.uid) {
      switch (body.action) {
        case "accept":
        case "decline":
          await respondToFriendRequest(
            db,
            caller.uid,
            body.uid,
            body.action === "accept",
          );
          return NextResponse.json({ ok: true });
        case "cancel":
          await cancelFriendRequest(db, caller.uid, body.uid);
          return NextResponse.json({ ok: true });
        case "remove":
          await removeFriend(db, caller.uid, body.uid);
          return NextResponse.json({ ok: true });
      }
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    if (error instanceof FriendError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Unable to update friends", error);
    return NextResponse.json(
      { error: "Unable to update friends" },
      { status: 500 },
    );
  }
}
