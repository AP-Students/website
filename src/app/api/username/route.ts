import { NextResponse, type NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/server/activityRequest";
import { claimUsername, FriendError } from "@/lib/server/friends";

// Sets or changes the caller's username. The server does this so two people
// can't end up with the same one.
export async function PUT(request: NextRequest) {
  const caller = await requireUser(request);
  if ("error" in caller) return caller.error;

  const body = (await request.json().catch(() => null)) as {
    username?: unknown;
  } | null;
  if (typeof body?.username !== "string") {
    return NextResponse.json(
      { error: "username must be a string" },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(
      await claimUsername(getAdminDb(), caller.uid, body.username),
    );
  } catch (error) {
    if (error instanceof FriendError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Unable to set username", error);
    return NextResponse.json(
      { error: "Unable to set username" },
      { status: 500 },
    );
  }
}
