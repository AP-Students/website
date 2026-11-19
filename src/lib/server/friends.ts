import {
  FieldValue,
  type Firestore,
  type Transaction,
} from "firebase-admin/firestore";
import { normalizeUsername, usernameProblem } from "../username.ts";

// Everything here runs with the Admin SDK. The rules don't let clients write
// usernames, friend requests or friend lists, so these are the only way in.

export class FriendError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const friendPaths = {
  username: (username: string) => `usernames/${username}`,
  user: (uid: string) => `users/${uid}`,
  friend: (uid: string, friendUid: string) =>
    `users/${uid}/friends/${friendUid}`,
  request: (from: string, to: string) => `friendRequests/${from}_${to}`,
};

const usernameOf = (data: Record<string, unknown> | undefined) =>
  typeof data?.username === "string" && data.username ? data.username : null;

export async function claimUsername(
  db: Firestore,
  uid: string,
  input: string,
): Promise<{ username: string }> {
  const username = normalizeUsername(input);
  const problem = usernameProblem(username);
  if (problem) throw new FriendError(problem, 400);

  return db.runTransaction(async (tx) => {
    const userRef = db.doc(friendPaths.user(uid));
    const user = await tx.get(userRef);
    if (!user.exists) throw new FriendError("User profile not found", 404);
    const current = usernameOf(user.data());
    const [wanted, old] = await tx.getAll(
      db.doc(friendPaths.username(username)),
      db.doc(friendPaths.username(current ?? username)),
    );
    if (wanted?.exists && wanted.data()?.uid !== uid)
      throw new FriendError("That username is taken.", 409);
    if (current === username) return { username };

    tx.set(db.doc(friendPaths.username(username)), { uid, username });
    if (current && old?.exists && old.data()?.uid === uid) tx.delete(old.ref);
    tx.update(userRef, { username });
    return { username };
  });
}

// Sends a request to the student with that username. If they already sent you
// one, you just become friends.
export async function sendFriendRequest(
  db: Firestore,
  uid: string,
  input: string,
): Promise<{ status: "pending" | "friends" }> {
  const username = normalizeUsername(input);
  return db.runTransaction(async (tx) => {
    const [me, target] = await tx.getAll(
      db.doc(friendPaths.user(uid)),
      db.doc(friendPaths.username(username)),
    );
    const myUsername = usernameOf(me?.data());
    if (!myUsername)
      throw new FriendError("Pick a username before adding friends.", 400);
    const friendUid: unknown = target?.exists ? target.data()?.uid : undefined;
    if (typeof friendUid !== "string")
      throw new FriendError("No one has that username.", 404);
    if (friendUid === uid)
      throw new FriendError("You can't add yourself.", 400);

    const [friendship, sent, received] = await tx.getAll(
      db.doc(friendPaths.friend(uid, friendUid)),
      db.doc(friendPaths.request(uid, friendUid)),
      db.doc(friendPaths.request(friendUid, uid)),
    );
    if (friendship?.exists) return { status: "friends" };
    if (received?.exists) {
      addFriendship(db, tx, uid, friendUid);
      tx.delete(received.ref);
      return { status: "friends" };
    }
    if (!sent?.exists) {
      tx.set(db.doc(friendPaths.request(uid, friendUid)), {
        from: uid,
        to: friendUid,
        fromUsername: myUsername,
        toUsername: username,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    return { status: "pending" };
  });
}

export async function respondToFriendRequest(
  db: Firestore,
  uid: string,
  fromUid: string,
  accept: boolean,
): Promise<void> {
  await db.runTransaction(async (tx) => {
    const request = await tx.get(db.doc(friendPaths.request(fromUid, uid)));
    if (!request.exists)
      throw new FriendError("That request is no longer there.", 404);
    if (accept) addFriendship(db, tx, uid, fromUid);
    tx.delete(request.ref);
  });
}

export async function cancelFriendRequest(
  db: Firestore,
  uid: string,
  toUid: string,
): Promise<void> {
  await db.doc(friendPaths.request(uid, toUid)).delete();
}

export async function removeFriend(
  db: Firestore,
  uid: string,
  friendUid: string,
): Promise<void> {
  const batch = db.batch();
  batch.delete(db.doc(friendPaths.friend(uid, friendUid)));
  batch.delete(db.doc(friendPaths.friend(friendUid, uid)));
  await batch.commit();
}

// For account deletion: frees the username and removes every friendship and
// request the account is part of.
export async function removeFriendData(
  db: Firestore,
  uid: string,
): Promise<void> {
  const [user, friends, sent, received] = await Promise.all([
    db.doc(friendPaths.user(uid)).get(),
    db.collection(`users/${uid}/friends`).get(),
    db.collection("friendRequests").where("from", "==", uid).get(),
    db.collection("friendRequests").where("to", "==", uid).get(),
  ]);
  const refs = [
    ...friends.docs.flatMap((friend) => [
      friend.ref,
      db.doc(friendPaths.friend(friend.id, uid)),
    ]),
    ...sent.docs.map((request) => request.ref),
    ...received.docs.map((request) => request.ref),
  ];
  const username = usernameOf(user.data());
  if (username) {
    const entry = await db.doc(friendPaths.username(username)).get();
    if (entry.data()?.uid === uid) refs.push(entry.ref);
  }
  // A batch takes up to 500 writes.
  for (let i = 0; i < refs.length; i += 500) {
    const batch = db.batch();
    refs.slice(i, i + 500).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

function addFriendship(db: Firestore, tx: Transaction, a: string, b: string) {
  const since = FieldValue.serverTimestamp();
  tx.set(db.doc(friendPaths.friend(a, b)), { uid: b, since });
  tx.set(db.doc(friendPaths.friend(b, a)), { uid: a, since });
}
