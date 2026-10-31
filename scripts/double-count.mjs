import assert from "node:assert/strict";
import { before, test } from "node:test";

// Checks that repeating an XP-earning action never pays its XP twice. Each
// test sends the requests the app sends when a student repeats the action:
//
//   - MCQ and FRQ: Submit double-clicked (two requests at once), then Retry
//     clicked twice (two more, one after the other).
//   - Reading: chapter marked Complete three times (twice at once, then again
//     after switching it away from Complete and back).
//
// XP must go up exactly once per action, by what that one request paid.
//
// Needs the emulators and a dev server pointed at them:
//
//   firebase emulators:start --only auth,firestore --project demo-fivehive
//   GCLOUD_PROJECT=demo-fivehive FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
//     FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 npm run dev
//   npm run test:double-count
//
// Every run seeds its own student and content, so it can be run again as is.

process.env.GCLOUD_PROJECT ??= "demo-fivehive";
process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
const project = process.env.GCLOUD_PROJECT;
const local = /^(127\.0\.0\.1|localhost):\d+$/;
if (
  !project.startsWith("demo-") ||
  !local.test(process.env.FIRESTORE_EMULATOR_HOST) ||
  !local.test(process.env.FIREBASE_AUTH_EMULATOR_HOST)
) {
  throw new Error("Use local emulators and a demo project for this check.");
}
const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

// Imported after the emulator variables are set, so the Admin SDK uses them.
const { initializeApp } = await import("firebase-admin/app");
const { getFirestore, Timestamp } = await import("firebase-admin/firestore");
const db = getFirestore(initializeApp({ projectId: project }));

const run = `dc-${Date.now()}`;
const ids = {
  subject: `${run}-subject`,
  unit: `${run}-unit`,
  chapter: `${run}-chapter`,
  test: `${run}-test`,
  frq: `${run}-frq`,
  submission: `${run}-submission`,
};
const unitPath = `subjects/${ids.subject}/units/${ids.unit}`;
let uid;
let idToken;

async function signUp() {
  const response = await fetch(
    `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `${run}@example.test`,
        password: "double-count",
        returnSecureToken: true,
      }),
    },
  );
  assert.equal(response.status, 200, "Auth emulator sign-up failed");
  const body = await response.json();
  return { uid: body.localId, idToken: body.idToken };
}

async function seed() {
  const batch = db.batch();
  batch.set(db.doc(`subjects/${ids.subject}`), {
    title: "Double-count subject",
    units: [
      {
        id: ids.unit,
        title: "Double-count unit",
        chapters: [{ id: ids.chapter, title: "Double-count chapter" }],
      },
    ],
  });
  batch.set(db.doc(`${unitPath}/chapters/${ids.chapter}`), {
    title: "Double-count chapter",
  });
  batch.set(db.doc(`${unitPath}/tests/${ids.test}`), {
    isPublic: true,
    questions: [
      { type: "mcq", answers: ["a"] },
      { type: "mcq", answers: ["b"] },
    ],
  });
  batch.set(db.doc(`${unitPath}/frqs/${ids.frq}`), {
    isPublic: true,
    title: "Double-count FRQ",
  });
  batch.set(db.doc(`ungraded-frqs/${ids.submission}`), {
    studentId: uid,
    submittedAt: Timestamp.now(),
    subject: ids.subject,
    unitId: ids.unit,
    templateId: ids.frq,
  });
  // The tracker saves Complete before it asks for the reading's XP.
  batch.set(db.doc(`users/${uid}/chapterData/${ids.chapter}`), {
    progress: "Complete",
  });
  await batch.commit();
}

async function post(route, body) {
  const response = await fetch(`${baseUrl}/api/activity/${route}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...body, timeZone: "America/New_York" }),
  });
  const payload = await response.json().catch(() => ({}));
  assert.equal(
    response.status,
    200,
    `POST /api/activity/${route} returned ${response.status}: ${JSON.stringify(payload)}`,
  );
  return payload;
}

async function readStats() {
  const data = (await db.doc(`userStats/${uid}`).get()).data() ?? {};
  return {
    xp: data.xp ?? 0,
    mcqTestsCompleted: data.mcqTestsCompleted ?? 0,
    frqsSubmitted: data.frqsSubmitted ?? 0,
    readingsCompleted: data.readingsCompleted ?? 0,
  };
}

/** XP rose once, by what the single paying request said it paid. */
async function assertPaidOnce(before, responses, counter) {
  const after = await readStats();
  const paying = responses.filter((response) => response.xpAwarded > 0);
  assert.equal(
    paying.length,
    1,
    `Expected one request to pay XP, got ${paying.length}: ${JSON.stringify(responses)}`,
  );
  assert.equal(
    after.xp - before.xp,
    paying[0].xpAwarded,
    `XP went from ${before.xp} to ${after.xp}, but one award is ${paying[0].xpAwarded}`,
  );
  assert.equal(
    after[counter] - before[counter],
    1,
    `${counter} went from ${before[counter]} to ${after[counter]}`,
  );
}

before(async () => {
  const health = await fetch(baseUrl).catch(() => null);
  if (!health) throw new Error(`No dev server at ${baseUrl}.`);
  ({ uid, idToken } = await signUp());
  await seed();
});

test("MCQ: double-clicked Submit, then Retry twice, pays XP once", async () => {
  const before = await readStats();
  const body = {
    subject: ids.subject,
    unitId: ids.unit,
    testId: ids.test,
    answers: { 0: ["a"], 1: ["c"] },
  };
  const responses = await Promise.all([post("mcq", body), post("mcq", body)]);
  responses.push(await post("mcq", body));
  responses.push(await post("mcq", body));
  await assertPaidOnce(before, responses, "mcqTestsCompleted");
});

test("FRQ: double-clicked Submit, then Retry twice, pays XP once", async () => {
  const before = await readStats();
  const body = { submissionId: ids.submission };
  const responses = await Promise.all([post("frq", body), post("frq", body)]);
  responses.push(await post("frq", body));
  responses.push(await post("frq", body));
  await assertPaidOnce(before, responses, "frqsSubmitted");
});

test("Reading: chapter marked Complete three times pays XP once", async () => {
  const before = await readStats();
  const body = {
    subject: ids.subject,
    unitId: ids.unit,
    chapterId: ids.chapter,
  };
  const responses = await Promise.all([
    post("reading", body),
    post("reading", body),
  ]);
  const chapterData = db.doc(`users/${uid}/chapterData/${ids.chapter}`);
  await chapterData.set({ progress: "Reading" }, { merge: true });
  await chapterData.set({ progress: "Complete" }, { merge: true });
  responses.push(await post("reading", body));
  await assertPaidOnce(before, responses, "readingsCompleted");
});
