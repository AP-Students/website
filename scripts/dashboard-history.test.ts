import assert from "node:assert/strict";
import { test } from "node:test";
import { Timestamp } from "firebase/firestore";
import {
  formatDayKey,
  toHistoryRow,
  toHistoryRows,
} from "../src/lib/dashboard/history.ts";
import { EMPTY_EVENTS, FIXTURE_EVENTS } from "../src/lib/dashboard/fixtures.ts";
import type { ActivityEvent } from "../src/types/dashboard.ts";

const event = (overrides: Partial<ActivityEvent>): ActivityEvent => ({
  id: "uid_frq_sub-1",
  userId: "uid",
  type: "frq",
  subject: "ap-physics-2",
  unitId: "unit-2",
  sourceId: "sub-1",
  label: "Fluid Dynamics",
  href: "/subject/ap-physics-2/unit-2-abc/frq/tmpl-1",
  occurredAt: Timestamp.fromDate(new Date("2026-09-20T18:00:00Z")),
  dayKey: "2026-09-20",
  xpAwarded: 25,
  gradeStatus: "pending",
  ...overrides,
});

test("graded and self-graded FRQs link to their feedback page", () => {
  for (const gradeStatus of ["graded", "self_graded"] as const) {
    const row = toHistoryRow(event({ gradeStatus }));
    assert.equal(row.href, "/frq-feedback/sub-1");
    assert.equal(row.action, "View feedback");
  }
});

test("an FRQ that isn't graded yet links back to the FRQ", () => {
  for (const gradeStatus of ["pending", "none"] as const) {
    const row = toHistoryRow(event({ gradeStatus }));
    assert.equal(row.href, "/subject/ap-physics-2/unit-2-abc/frq/tmpl-1");
    assert.equal(row.action, "View FRQ");
  }
  assert.equal(
    toHistoryRow(event({ gradeStatus: "pending" })).status,
    "Awaiting grade",
  );
});

test("every graded fixture row points at /frq-feedback/<submission id>", () => {
  const graded = FIXTURE_EVENTS.filter(
    (fixture) =>
      fixture.type === "frq" &&
      (fixture.gradeStatus === "graded" ||
        fixture.gradeStatus === "self_graded"),
  );
  assert.ok(graded.length >= 2, "fixtures should include graded FRQs");
  for (const fixture of graded) {
    assert.equal(
      toHistoryRow(fixture).href,
      `/frq-feedback/${fixture.sourceId}`,
    );
  }
});

test("MCQ tests show their score, readings show completion", () => {
  const mcq = toHistoryRow(
    event({
      type: "mcq_test",
      gradeStatus: "none",
      score: { correct: 4, total: 5 },
    }),
  );
  assert.equal(mcq.typeLabel, "MCQ Test");
  assert.equal(mcq.status, "4/5 correct");

  const reading = toHistoryRow(event({ type: "reading", gradeStatus: "none" }));
  assert.equal(reading.typeLabel, "Reading");
  assert.equal(reading.status, "Completed");
});

test("the date is the student's own day, not the UTC instant", () => {
  // 11pm in Los Angeles is already the next day in UTC.
  const lateNight = toHistoryRow(
    event({
      occurredAt: Timestamp.fromDate(new Date("2026-09-21T06:00:00Z")),
      dayKey: "2026-09-20",
    }),
  );
  assert.equal(lateNight.date, "Sep 20, 2026");
  assert.equal(formatDayKey("2026-01-05"), "Jan 5, 2026");
  assert.equal(formatDayKey("not a day"), "not a day");
});

test("rows are newest first", () => {
  const older = event({
    id: "older",
    occurredAt: Timestamp.fromDate(new Date("2026-09-01")),
  });
  const newer = event({
    id: "newer",
    occurredAt: Timestamp.fromDate(new Date("2026-09-30")),
  });
  assert.deepEqual(
    toHistoryRows([older, newer]).map((row) => row.id),
    ["newer", "older"],
  );
});

test("no events means no rows, for the empty state", () => {
  assert.deepEqual(toHistoryRows(EMPTY_EVENTS), []);
});
