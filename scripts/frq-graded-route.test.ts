import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { isValidElement, type ReactElement } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { FrqGradeAwardError } from "../src/lib/server/awardFrqGrade.ts";

// Execute the actual route/auth source with module-boundary doubles. This keeps
// Node's existing test runner independent of Next's alias loader and credentials.
function moduleExports(
  path: string,
  dependencies: Record<string, unknown>,
  globals: Record<string, unknown> = {},
) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const exports: Record<string, unknown> = {};
  const require = (name: string): unknown => {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
    return dependencies[name];
  };
  runInNewContext(
    output,
    { require, exports, console, ...globals },
    { filename: path, timeout: 5000 },
  );
  return exports;
}
const next = {
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(body), {
        ...init,
        headers: { "Content-Type": "application/json" },
      }),
  },
};

function elements(node: unknown): ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node))
    return node.flatMap((child: unknown) => elements(child));
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return [node, ...elements(node.props.children)];
}
const settle = () => new Promise<void>((resolve) => setImmediate(resolve));

void test("notification bell persists individual and bulk acknowledgements and reports failures", async () => {
  const calls: string[] = [];
  const errors: string[] = [];
  const componentModule = moduleExports(
    "../src/components/dashboard/NotificationBell.tsx",
    {
      "react/jsx-runtime": jsxRuntime,
      "next/link": { default: "a" },
      sonner: { toast: { error: (message: string) => errors.push(message) } },
      "lucide-react": {
        Award: "svg",
        Bell: "svg",
        PenLine: "svg",
        TrendingUp: "svg",
      },
      "@/components/ui/popover": {
        Popover: "div",
        PopoverContent: "div",
        PopoverTrigger: "div",
      },
      "@/lib/utils": { cn: () => "" },
    },
  );
  const Bell = componentModule.default as (
    props: Record<string, unknown>,
  ) => unknown;
  const notifications = ["one", "two", "read"].map((id) => ({
    id,
    type: "frq_graded",
    title: id,
    href: `/frq-feedback/${id}`,
    readAt: id === "read" ? "timestamp" : null,
    createdAt: { toDate: () => new Date() },
  }));
  const render = () =>
    elements(
      Bell({
        notifications,
        markRead: async (id: string) => {
          calls.push(id);
          if (id === "two") throw new Error("write failed");
          notifications.find((item) => item.id === id)!.readAt = "timestamp";
        },
      }),
    );
  const link = render().find(
    (item) => item.type === "a" && item.props.href === "/frq-feedback/one",
  )!;
  (link.props.onClick as () => void)();
  await settle();
  assert.deepEqual(calls, ["one"]);
  const bulk = render().find(
    (item) =>
      item.type === "button" && item.props.children === "Mark all as read",
  )!;
  (bulk.props.onClick as () => void)();
  await settle();
  assert.deepEqual(calls, ["one", "two"]);
  assert.equal(notifications[1]?.readAt, null);
  assert.equal(errors.length, 1);
});

void test("saved FRQ processing can retry after failure without touching the queue or changing the grade", async () => {
  const state: unknown[] = [];
  let cursor = 0;
  const calls: string[] = [];
  let writes = 0;
  const componentModule = moduleExports(
    "../src/components/frq/gradingRenderer.tsx",
    {
      "react/jsx-runtime": jsxRuntime,
      react: {
        useMemo: (callback: () => unknown) => callback(),
        useState: (initial: unknown) => {
          const index = cursor++;
          if (!(index in state))
            state[index] =
              typeof initial === "function"
                ? (initial as () => unknown)()
                : initial;
          return [
            state[index],
            (value: unknown) => {
              state[index] =
                typeof value === "function"
                  ? (value as (previous: unknown) => unknown)(state[index])
                  : value;
            },
          ];
        },
      },
      "@/components/article-creator/custom_questions/RenderAdvancedTextbox": {
        RenderContent: "div",
      },
      "@/lib/firebase": { db: {} },
      "@/lib/gamification/reportActivity": {
        reportFrqGrade: async (id: string) => {
          calls.push(id);
          if (calls.length === 1) throw new Error("temporary outage");
          return { xpAwarded: 25 };
        },
      },
      "next/link": { default: "a" },
      "next/navigation": { useRouter: () => ({ push: () => undefined }) },
      "lucide-react": { LogOut: "svg" },
      "firebase/firestore": {
        runTransaction: () => {
          writes++;
          throw new Error("Must not resave grade");
        },
      },
      "@/lib/firestore/frqRefs": {},
      "@/components/frq/grading/gradingFooter": "div",
      "@/components/frq/grading/partCard": {},
      "@/components/frq/usePendingPartScroll": {
        usePendingPartScroll: () => undefined,
      },
      "@/lib/frq/gradingView": {
        getGradingParts: () => [],
        createEmptyGrades: () => ({}),
        getEarnedPoints: () => 0,
        countGradedParts: () => 0,
      },
      "@/lib/frq/template": { getTemplatePoints: () => 0 },
      "@/components/hooks/UserContext": {
        useUser: () => ({ user: { uid: "staff" } }),
      },
    },
    { window: { alert: () => undefined }, console: { error: () => undefined } },
  );
  const Renderer = componentModule.default as (
    props: Record<string, unknown>,
  ) => unknown;
  const render = () => {
    cursor = 0;
    return elements(
      Renderer({
        submission: { id: "attempt" },
        template: null,
        savedGrade: true,
      }),
    );
  };
  const click = () => {
    (
      render().find((item) => item.type === "button")!.props
        .onClick as () => void
    )();
  };
  click();
  await settle();
  assert.ok(render().some((item) => item.props.role === "alert"));
  assert.equal(
    render().find((item) => item.type === "button")?.props.disabled,
    false,
  );
  click();
  await settle();
  assert.deepEqual(calls, ["attempt", "attempt"]);
  assert.equal(writes, 0);
  assert.equal(
    render().find((item) => item.type === "button")?.props.disabled,
    true,
  );
  assert.equal(
    render().some((item) => item.props.role === "alert"),
    false,
  );
});
type Caller = { uid: string } | { error: Response };
function fixture() {
  const calls: unknown[][] = [];
  let configReads = 0;
  const auth = moduleExports("../src/lib/server/activityRequest.ts", {
    "next/server": next,
    "@/lib/firebase-admin": {
      getAdminAuth: () => ({
        verifyIdToken: async (token: string) => {
          if (token === "invalid") throw new Error("invalid token");
          return { uid: token };
        },
      }),
    },
  });
  const route = moduleExports("../src/app/api/activity/frq-graded/route.ts", {
    "next/server": next,
    "@/lib/server/activityRequest": auth,
    "@/lib/firebase-admin": { getAdminDb: () => "trusted-db" },
    "@/lib/gamification/loadXpConfig": {
      loadXpConfig: async () => {
        configReads++;
        return { frqGradeBonus: 73 };
      },
    },
    "@/lib/server/awardFrqGrade": {
      FrqGradeAwardError,
      awardFrqGrade: async (...args: unknown[]) => {
        calls.push(args);
        if (args[1] !== "staff")
          throw new FrqGradeAwardError("Staff access required", 403);
        return { xpAwarded: 73 };
      },
    },
  });
  const post = route.POST as (request: Request) => Promise<Response>;
  const request = (
    token?: string,
    body: unknown = { submissionId: "attempt" },
  ) =>
    new Request("http://localhost/api/activity/frq-graded", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
  return { calls, post, request, auth, configReads: () => configReads };
}
void test("missing authentication rejects before settings or payout access", async () => {
  const f = fixture();
  assert.equal((await f.post(f.request())).status, 401);
  assert.deepEqual(f.calls, []);
  assert.equal(f.configReads(), 0);
});
void test("invalid Firebase tokens are rejected server-side", async () => {
  const f = fixture();
  const verify = f.auth.requireUser as (request: Request) => Promise<Caller>;
  const result = await verify(f.request("invalid"));
  assert.ok("error" in result);
  assert.equal(result.error.status, 401);
  assert.deepEqual(f.calls, []);
});
void test("authenticated non-staff receives the payout service's 403", async () => {
  const f = fixture();
  assert.equal((await f.post(f.request("student"))).status, 403);
});
void test("staff request passes only saved ID and configured bonus; fake score and owner are ignored", async () => {
  const f = fixture();
  const response = await f.post(
    f.request("staff", {
      submissionId: "attempt",
      score: "999/1",
      studentId: "grader",
      maxScore: 1,
      xp: 9999,
    }),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { xpAwarded: 73 });
  assert.deepEqual(f.calls, [
    ["trusted-db", "staff", "attempt", { frqGradeBonus: 73 }],
  ]);
  assert.equal(f.configReads(), 1);
});
void test("invalid submission IDs never reach the payout service", async () => {
  const f = fixture();
  for (const submissionId of ["", "a/b", null, 5]) {
    assert.equal(
      (await f.post(f.request("staff", { submissionId }))).status,
      400,
    );
  }
  assert.deepEqual(f.calls, []);
  assert.equal(f.configReads(), 0);
});

void test("MCQ legacy event ID collisions still record distinct completions once without XP, streak, or calendar writes", async () => {
  const docs = new Map<string, Record<string, unknown>>([
    ["subjects/physics", { units: [{ id: "unit" }] }],
    [
      "subjects/physics/units/unit/tests/shared",
      { isPublic: true, questions: [{ type: "mcq", answers: ["a"] }] },
    ],
    [
      "userStats/student",
      {
        xp: 100,
        level: 2,
        currentStreak: 4,
        mcqTestsCompleted: 1,
        subjectsCompleted: 0,
      },
    ],
    [
      "activityEvents/student_mcq_test_shared",
      { subject: "other-subject", unitId: "other-unit", sourceId: "shared" },
    ],
  ]);
  const snapshot = (path: string) => ({
    exists: docs.has(path),
    data: () => docs.get(path),
  });
  type Reference = {
    path: string;
    id: string;
    collection: (id: string) => Reference;
    doc: (id: string) => Reference;
    get: () => Promise<ReturnType<typeof snapshot>>;
  };
  const ref = (path: string): Reference => ({
    path,
    id: path.split("/").at(-1)!,
    collection: (id) => ref(`${path}/${id}`),
    doc: (id) => ref(`${path}/${id}`),
    get: async () => snapshot(path),
  });
  const writes: string[] = [];
  const transaction = {
    get: async (reference: { path: string }) => snapshot(reference.path),
    set: (reference: { path: string }, data: Record<string, unknown>) => {
      writes.push(reference.path);
      docs.set(reference.path, { ...docs.get(reference.path), ...data });
    },
  };
  const db = {
    collection: ref,
    doc: ref,
    runTransaction: async (
      callback: (value: typeof transaction) => Promise<unknown>,
    ) => callback(transaction),
  };
  let completed = false;
  let completionWrites = 0;
  const route = moduleExports("../src/app/api/activity/mcq/route.ts", {
    "next/server": next,
    "firebase-admin/firestore": {
      FieldValue: { serverTimestamp: () => "timestamp" },
    },
    "@/lib/firebase-admin": { getAdminDb: () => db },
    "@/types/dashboard": {
      dashboardDocumentPaths: {
        activity: (id: string) => `activityEvents/${id}`,
        stats: (uid: string) => `userStats/${uid}`,
      },
    },
    "@/lib/gamification/streak": {
      readStreakState: (data: Record<string, unknown>) => ({
        currentStreak: data.currentStreak,
      }),
    },
    "@/lib/gamification/xp": {
      readXpTotal: (data: Record<string, unknown>) => data.xp,
    },
    "@/lib/gamification/loadXpConfig": {
      loadXpConfig: async () => ({ mcqTestComplete: 10, mcqCorrectAnswer: 5 }),
    },
    "@/lib/server/activityRequest": {
      requireUser: async () => ({ uid: "student" }),
      isDocumentId: (value: unknown) =>
        typeof value === "string" && !value.includes("/"),
    },
    "@/lib/server/awardAchievements": { awardAchievements: async () => [] },
    "@/lib/server/testCompletion": {
      prepareTestCompletion: async () => ({
        alreadyCompleted: completed,
        subjectCompleted: !completed,
        write: () => {
          if (!completed) completionWrites++;
          completed = true;
        },
      }),
    },
  });
  const post = route.POST as (request: Request) => Promise<Response>;
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await post(
      new Request("http://localhost/api/activity/mcq", {
        method: "POST",
        body: JSON.stringify({
          subject: "physics",
          unitId: "unit",
          testId: "shared",
          answers: { "0": ["a"] },
        }),
      }),
    );
    assert.equal(response.status, 200);
    const result = (await response.json()) as Record<string, unknown>;
    assert.equal(result.xpAwarded, 0);
    assert.equal(result.currentStreak, 4);
  }
  assert.equal(completionWrites, 1);
  assert.deepEqual(writes, ["userStats/student"]);
  assert.equal(docs.get("userStats/student")?.mcqTestsCompleted, 2);
  assert.equal(docs.get("userStats/student")?.subjectsCompleted, 1);
  assert.equal(docs.get("userStats/student")?.xp, 100);
  assert.equal(docs.get("userStats/student")?.currentStreak, 4);
});
