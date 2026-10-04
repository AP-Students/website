import assert from "node:assert/strict";
import { before, test } from "node:test";

// firebase emulators:exec --only firestore --project demo-fivehive
// "node --test scripts/firestore-rules.test.mjs"
const host = process.env.FIRESTORE_EMULATOR_HOST;
const project = process.env.GCLOUD_PROJECT ?? "demo-fivehive";
if (
  host &&
  (!/^(127\.0\.0\.1|localhost):\d+$/.test(host) || !project.startsWith("demo-"))
) {
  throw new Error("Use a local emulator and a demo project for rules tests.");
}
const root = `projects/${project}/databases/(default)/documents`;
const base = `http://${host}/v1/${root}`;
const fields = (data) =>
  Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, encode(value)]),
  );
function encode(value) {
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (value === null) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "number") return { integerValue: String(value) };
  if (typeof value === "boolean") return { booleanValue: value };
  if (Array.isArray(value))
    return { arrayValue: { values: value.map(encode) } };
  return { mapValue: { fields: fields(value) } };
}
function token(uid) {
  const now = Math.floor(Date.now() / 1000);
  const part = (value) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${part({ alg: "none", typ: "JWT" })}.${part({
    aud: project,
    iss: `https://securetoken.google.com/${project}`,
    sub: uid,
    user_id: uid,
    iat: now,
    exp: now + 3600,
    firebase: { sign_in_provider: "custom" },
  })}.`;
}
async function request(suffix, uid, method = "GET", body) {
  return fetch(`${base}${suffix}`, {
    method,
    signal: AbortSignal.timeout(15_000),
    headers: {
      Authorization: `Bearer ${uid === "server" ? "owner" : token(uid)}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
const doc = (path, uid, method = "GET", data) =>
  request(`/${path}`, uid, method, data ? { fields: fields(data) } : undefined);
const stamp = (fieldPath) => ({ fieldPath, setToServerValue: "REQUEST_TIME" });
const commit = (uid, path, data, times = [], deletes = []) =>
  request(":commit", uid, "POST", {
    writes: [
      {
        update: { name: `${root}/${path}`, fields: fields(data) },
        updateTransforms: times.map(stamp),
      },
      ...deletes.map((path) => ({ delete: `${root}/${path}` })),
    ],
  });
async function status(response, expected) {
  assert.equal(response.status, expected, await response.text());
}
const owned = [
  "userStats/student",
  "users/student/completedTests/test",
  "users/student/completedSubjects/subject",
  "users/student/achievements/achievement",
];
const submittedAt = new Date("2026-10-01T12:00:00.000Z");
const queued = {
  templateId: "template",
  subject: "physics",
  unitId: "unit",
  studentId: "student",
  responses: { part: "answer" },
  submittedAt,
};
const savedGrade = {
  ...queued,
  sourceSubmissionId: "attempt",
  score: "2/3",
  feedback: "Good",
  grades: [],
  graderId: "staff",
  gradedAt: submittedAt,
  queueClaimedAt: submittedAt,
};
before(async () => {
  if (!host) return;
  for (const [path, data] of [
    ["users/student", { access: "user", uid: "student" }],
    ["users/other", { access: "user", uid: "other" }],
    ["users/staff", { access: "grader", uid: "staff" }],
    ["users/another-grader", { access: "grader", uid: "another-grader" }],
    ["users/admin", { access: "admin", uid: "admin" }],
    ...[...owned, "xpAwards/receipt"].map((path) => [path, { xp: 10 }]),
    ["config/xp", { frqGradeBonus: 25 }],
    [
      "notifications/student/items/notice",
      { title: "Earned", readAt: null, expiresAt: null },
    ],
    ["graded-frqs/attempt", savedGrade],
    [
      "self-graded-frqs/self",
      { studentId: "student", score: "2/3", graderId: "student" },
    ],
    ["ungraded-frqs/pending", { studentId: "student" }],
    [
      "users/student/frqResponses/legacy",
      { userId: "student", responseText: "answer", grade: "2/3" },
    ],
  ])
    await status(await doc(path, "server", "PATCH", data), 200);
});
const check = (name, fn) => test(name, { skip: !host }, fn);
check(
  "progress and payout state cannot be forged, deleted, or read by other students",
  async () => {
    for (const path of [...owned, "xpAwards/receipt"]) {
      for (const method of ["PATCH", "DELETE"])
        await status(
          await doc(
            path,
            "student",
            method,
            method === "PATCH" ? { xp: 999 } : undefined,
          ),
          403,
        );
      await status(
        await doc(`${path}-new`, "student", "PATCH", { xp: 999 }),
        403,
      );
      await status(await doc(path, "other"), 403);
      await status(
        await doc(path, "student"),
        path.startsWith("xpAwards/") ? 403 : 200,
      );
    }
    await status(
      await doc("users/student", "student", "PATCH", { access: "admin" }),
      403,
    );
    await status(
      await doc("users/student", "student", "PATCH", {
        access: "user",
        uid: "student",
        xp: 999,
      }),
      403,
    );
  },
);
check(
  "XP admin's full settings save works and non-admin writes fail",
  async () => {
    const config = {
      readingComplete: 10,
      mcqTestComplete: 10,
      mcqCorrectAnswer: 1,
      frqSubmission: 15,
      frqGradeBonus: 73,
      streakDay: 5,
      streakMilestones: { 7: 50 },
      updatedBy: "admin",
    };
    await status(await doc("config/xp", "student"), 200);
    for (const uid of ["student", "staff"]) {
      await status(
        await commit(uid, "config/xp", { ...config, updatedBy: uid }, [
          "updatedAt",
        ]),
        403,
      );
      await status(await doc("config/xp", uid, "DELETE"), 403);
    }
    await status(
      await commit("admin", "config/xp", config, ["updatedAt"]),
      200,
    );
    const saved = await doc("config/xp", "admin");
    assert.equal((await saved.json()).fields.frqGradeBonus.integerValue, "73");
  },
);
check(
  "submission and grade ownership/staff permissions preserve official and self grading",
  async () => {
    for (const path of [
      "graded-frqs/attempt",
      "self-graded-frqs/self",
      "ungraded-frqs/pending",
      "users/student/frqResponses/legacy",
    ]) {
      await status(await doc(path, "student"), 200);
      await status(await doc(path, "staff"), 200);
      await status(await doc(path, "other"), 403);
      await status(
        await doc(path, "student", "PATCH", {
          studentId: "student",
          score: "3/3",
        }),
        403,
      );
    }
    await status(
      await commit(
        "staff",
        "graded-frqs/attempt",
        { ...savedGrade, score: "3/3" },
        ["gradedAt"],
      ),
      200,
    );
    const grade = { ...savedGrade, sourceSubmissionId: "new" };
    await status(
      await commit("student", "graded-frqs/new", grade, ["gradedAt"]),
      403,
    );
    await status(
      await commit("staff", "graded-frqs/new", grade, ["gradedAt"]),
      403,
    );
    await status(
      await doc("ungraded-frqs/new", "server", "PATCH", queued),
      200,
    );
    await status(
      await commit(
        "student",
        "self-graded-frqs/new",
        { ...grade, graderId: "student" },
        ["gradedAt", "queueClaimedAt"],
        ["ungraded-frqs/new"],
      ),
      200,
    );
    await status(
      await commit(
        "other",
        "self-graded-frqs/forged",
        { ...grade, sourceSubmissionId: "forged", graderId: "other" },
        ["gradedAt"],
      ),
      403,
    );
  },
);
check(
  "official grades require an atomic matching queue claim, and provenance cannot be rewritten",
  async () => {
    const grade = { ...savedGrade, sourceSubmissionId: "claim" };
    const times = ["gradedAt", "queueClaimedAt"];
    const deletes = ["ungraded-frqs/claim"];
    await status(
      await commit("staff", "graded-frqs/claim", grade, times, deletes),
      403,
    );
    await status(
      await doc("ungraded-frqs/claim", "server", "PATCH", queued),
      200,
    );
    // A saved document alone, a missing claim stamp, or a substituted owner/FRQ
    // never proves that the student submission was legitimately graded.
    await status(await commit("staff", "graded-frqs/claim", grade, times), 403);
    const { queueClaimedAt: _stamp, ...withoutClaim } = grade;
    await status(
      await commit(
        "staff",
        "graded-frqs/claim",
        withoutClaim,
        ["gradedAt"],
        deletes,
      ),
      403,
    );
    for (const changes of [
      { studentId: "other" },
      { templateId: "arbitrary" },
      { subject: "arbitrary" },
      { unitId: "arbitrary" },
      { responses: { part: "substituted" } },
      { submittedAt: new Date(0) },
      { graderId: "another-grader" },
    ])
      await status(
        await commit(
          "staff",
          "graded-frqs/claim",
          { ...grade, ...changes },
          times,
          deletes,
        ),
        403,
      );
    await status(
      await commit("staff", "graded-frqs/claim", grade, times, deletes),
      200,
    );
    await status(
      await commit("staff", "graded-frqs/claim", grade, times, deletes),
      403,
    );
    const response = await doc("graded-frqs/claim", "staff");
    const actual = (await response.json()).fields;
    for (const [field, value] of [
      ["studentId", { stringValue: "other" }],
      ["templateId", { stringValue: "arbitrary" }],
      ["graderId", { stringValue: "another-grader" }],
      ["queueClaimedAt", { timestampValue: new Date(0).toISOString() }],
    ])
      await status(
        await request("/graded-frqs/claim", "staff", "PATCH", {
          fields: { ...actual, [field]: value },
        }),
        403,
      );
    await status(
      await request(":commit", "another-grader", "POST", {
        writes: [
          {
            update: {
              name: `${root}/graded-frqs/claim`,
              fields: { ...actual, score: { stringValue: "3/3" } },
            },
            updateTransforms: [stamp("gradedAt")],
          },
        ],
      }),
      403,
    );
    await status(
      await request(":commit", "staff", "POST", {
        writes: [
          {
            update: {
              name: `${root}/graded-frqs/claim`,
              fields: { ...actual, score: { stringValue: "3/3" } },
            },
            updateTransforms: [stamp("gradedAt")],
          },
        ],
      }),
      200,
    );
  },
);
check(
  "notifications are private, server-created, and acknowledge-only with server timestamps",
  async () => {
    const path = "notifications/student/items/notice";
    const original = { title: "Earned", readAt: null, expiresAt: null };
    await status(await doc(path, "student"), 200);
    await status(await doc(path, "other"), 403);
    for (const changes of [
      { title: "Forged" },
      { expiresAt: "invalid" },
      { readAt: "invalid" },
    ]) {
      await status(
        await doc(path, "student", "PATCH", { ...original, ...changes }),
        403,
      );
    }
    await status(await doc(path, "student", "DELETE"), 403);
    await status(await doc(`${path}-new`, "student", "PATCH", original), 403);
    await status(await commit("student", path, original, ["readAt"]), 200);
  },
);
