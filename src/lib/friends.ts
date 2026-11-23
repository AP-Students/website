import { auth } from "@/lib/firebase";

export type FriendAction = "accept" | "decline" | "cancel" | "remove";

async function call(
  path: string,
  method: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error("You're signed out. Sign in and try again.");
  const response = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  if (!response.ok) {
    // The server's message is written for students ("That username is taken.").
    throw new Error(
      typeof data.error === "string" && response.status < 500
        ? data.error
        : "Something went wrong. Please try again.",
    );
  }
  return data;
}

export const setUsername = (username: string) =>
  call("/api/username", "PUT", { username });

export const sendFriendRequest = async (username: string) =>
  (await call("/api/friends", "POST", { action: "request", username }))
    .status as "pending" | "friends";

export const updateFriend = (action: FriendAction, uid: string) =>
  call("/api/friends", "POST", { action, uid });
