import assert from "node:assert/strict";
import { before, test } from "node:test";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import {
  cancelFriendRequest,
  claimUsername,
  FriendError,
  removeFriend,
  removeFriendData,
  respondToFriendRequest,
  sendFriendRequest,
} from "../src/lib/server/friends.ts";

// Runs against the Firestore emulator:
//   firebase emulators:exec --only firestore --project demo-fivehive \
//     "node --test --experimental-strip-types scripts/friends-server.test.ts"
// Skipped otherwise, so plain `npm test` still passes.
const host = process.env.FIRESTORE_EMULATOR_HOST;
const skip = host ? false : "needs the Firestore emulator";
let db: Firestore;
let run = 0;

before(() => {
  if (!host) return;
  if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host))
    throw new Error("Use a local emulator for these tests.");
  db = getFirestore(
    initializeApp({ projectId: "demo-fivehive" }, "friends-test"),
  );
});

// Fresh uids per test so tests don't see each other's data.
async function users<T extends string[]>(
  ...names: T
): Promise<{ [K in keyof T]: string }> {
  run += 1;
  const ids = names.map((name) => `${name}-${run}`);
  await Promise.all(
    ids.map((uid) => db.doc(`users/${uid}`).set({ uid, displayName: uid })),
  );
  return ids as { [K in keyof T]: string };
}
const exists = async (path: string) => (await db.doc(path).get()).exists;
const rejects = (promise: Promise<unknown>, status: number, message: RegExp) =>
  assert.rejects(
    promise,
    (error) =>
      error instanceof FriendError &&
      error.status === status &&
      message.test(error.message),
  );

test(
  "claiming a username saves it, and the same name can't be taken twice",
  { skip },
  async () => {
    const [a, b] = await users("a", "b");
    assert.deepEqual(await claimUsername(db, a, " @Sam_Lee "), {
      username: "sam_lee",
    });
    assert.equal(
      (await db.doc(`users/${a}`).get()).data()?.username,
      "sam_lee",
    );
    assert.deepEqual((await db.doc("usernames/sam_lee").get()).data(), {
      uid: a,
      username: "sam_lee",
    });
    await rejects(claimUsername(db, b, "SAM_LEE"), 409, /taken/);
    // Claiming your own name again is fine.
    assert.deepEqual(await claimUsername(db, a, "sam_lee"), {
      username: "sam_lee",
    });
    await db.doc("usernames/sam_lee").delete();
  },
);

test("changing your username frees the old one", { skip }, async () => {
  const [a, b] = await users("a", "b");
  await claimUsername(db, a, `first_${run}`);
  await claimUsername(db, a, `second_${run}`);
  assert.equal(await exists(`usernames/first_${run}`), false);
  assert.equal(
    (await db.doc(`users/${a}`).get()).data()?.username,
    `second_${run}`,
  );
  // Now someone else can have it.
  await claimUsername(db, b, `first_${run}`);
});

test(
  "bad usernames are refused before anything is written",
  { skip },
  async () => {
    const [a] = await users("a");
    await rejects(claimUsername(db, a, "ab"), 400, /at least 3/);
    await rejects(claimUsername(db, a, "admin"), 400, /isn't available/);
    assert.equal(
      (await db.doc(`users/${a}`).get()).data()?.username,
      undefined,
    );
  },
);

test(
  "two people grabbing the same name at once: exactly one gets it",
  { skip },
  async () => {
    const [a, b] = await users("a", "b");
    const name = `race_${run}`;
    const results = await Promise.allSettled([
      claimUsername(db, a, name),
      claimUsername(db, b, name),
    ]);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    const owner = (await db.doc(`usernames/${name}`).get()).data()?.uid;
    const loser = owner === a ? b : a;
    assert.equal(
      (await db.doc(`users/${loser}`).get()).data()?.username,
      undefined,
    );
  },
);

test(
  "friend requests need your own username and a real other person",
  { skip },
  async () => {
    const [a, b] = await users("a", "b");
    await claimUsername(db, b, `bee_${run}`);
    await rejects(
      sendFriendRequest(db, a, `bee_${run}`),
      400,
      /Pick a username/,
    );
    await claimUsername(db, a, `ay_${run}`);
    await rejects(
      sendFriendRequest(db, a, `nobody_${run}`),
      404,
      /No one has that username/,
    );
    await rejects(
      sendFriendRequest(db, a, `ay_${run}`),
      400,
      /can't add yourself/,
    );
  },
);

test(
  "send, accept: both become friends and the request is gone",
  { skip },
  async () => {
    const [a, b] = await users("a", "b");
    await claimUsername(db, a, `ay_${run}`);
    await claimUsername(db, b, `bee_${run}`);
    assert.deepEqual(await sendFriendRequest(db, a, `@BEE_${run}`), {
      status: "pending",
    });
    const request = (await db.doc(`friendRequests/${a}_${b}`).get()).data();
    assert.equal(request?.from, a);
    assert.equal(request?.fromUsername, `ay_${run}`);
    // Sending again doesn't duplicate it.
    assert.deepEqual(await sendFriendRequest(db, a, `bee_${run}`), {
      status: "pending",
    });

    await respondToFriendRequest(db, b, a, true);
    assert.equal(await exists(`users/${a}/friends/${b}`), true);
    assert.equal(await exists(`users/${b}/friends/${a}`), true);
    assert.equal(await exists(`friendRequests/${a}_${b}`), false);
    assert.deepEqual(await sendFriendRequest(db, a, `bee_${run}`), {
      status: "friends",
    });
    await rejects(
      respondToFriendRequest(db, b, a, true),
      404,
      /no longer there/,
    );
  },
);

test(
  "if they already asked you, asking them back makes you friends",
  { skip },
  async () => {
    const [a, b] = await users("a", "b");
    await claimUsername(db, a, `ay_${run}`);
    await claimUsername(db, b, `bee_${run}`);
    await sendFriendRequest(db, a, `bee_${run}`);
    assert.deepEqual(await sendFriendRequest(db, b, `ay_${run}`), {
      status: "friends",
    });
    assert.equal(await exists(`users/${a}/friends/${b}`), true);
    assert.equal(await exists(`friendRequests/${a}_${b}`), false);
    assert.equal(await exists(`friendRequests/${b}_${a}`), false);
  },
);

test("decline and cancel just remove the request", { skip }, async () => {
  const [a, b, c] = await users("a", "b", "c");
  await claimUsername(db, a, `ay_${run}`);
  await claimUsername(db, b, `bee_${run}`);
  await claimUsername(db, c, `cee_${run}`);
  await sendFriendRequest(db, a, `bee_${run}`);
  await respondToFriendRequest(db, b, a, false);
  assert.equal(await exists(`friendRequests/${a}_${b}`), false);
  assert.equal(await exists(`users/${a}/friends/${b}`), false);

  await sendFriendRequest(db, a, `cee_${run}`);
  await cancelFriendRequest(db, a, c);
  assert.equal(await exists(`friendRequests/${a}_${c}`), false);
});

test("unfriending removes it for both people", { skip }, async () => {
  const [a, b] = await users("a", "b");
  await claimUsername(db, a, `ay_${run}`);
  await claimUsername(db, b, `bee_${run}`);
  await sendFriendRequest(db, a, `bee_${run}`);
  await respondToFriendRequest(db, b, a, true);
  await removeFriend(db, b, a);
  assert.equal(await exists(`users/${a}/friends/${b}`), false);
  assert.equal(await exists(`users/${b}/friends/${a}`), false);
});

test(
  "deleting an account frees its username and removes its friends and requests",
  { skip },
  async () => {
    const [a, b, c, d] = await users("a", "b", "c", "d");
    for (const [uid, name] of [
      [a, "ay"],
      [b, "bee"],
      [c, "cee"],
      [d, "dee"],
    ] as const)
      await claimUsername(db, uid, `${name}_${run}`);
    await sendFriendRequest(db, a, `bee_${run}`);
    await respondToFriendRequest(db, b, a, true);
    await sendFriendRequest(db, a, `cee_${run}`);
    await sendFriendRequest(db, d, `ay_${run}`);

    await removeFriendData(db, a);
    assert.equal(await exists(`usernames/ay_${run}`), false);
    assert.equal(await exists(`users/${a}/friends/${b}`), false);
    assert.equal(await exists(`users/${b}/friends/${a}`), false);
    assert.equal(await exists(`friendRequests/${a}_${c}`), false);
    assert.equal(await exists(`friendRequests/${d}_${a}`), false);
    // Other people's data is untouched.
    assert.equal(await exists(`usernames/bee_${run}`), true);
  },
);
