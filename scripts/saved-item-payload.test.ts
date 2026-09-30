import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSavedItem, pathContext } from "../src/lib/savedItemPayload.ts";

test("pathContext reads a real chapter URL", () => {
  assert.deepEqual(
    pathContext(
      "/subject/biology/unit-1-xgxskm69/chapter/0kvtm3P4/structure-of-water-and-hydrogen-bonding",
    ),
    { subject: "biology", unitId: "unit-1", refId: "0kvtm3P4" },
  );
});

test("pathContext reads a real test URL", () => {
  assert.deepEqual(
    pathContext("/subject/biology/unit-1-xgxskm69/test/dip7d52n"),
    { subject: "biology", unitId: "unit-1", refId: "dip7d52n" },
  );
});

test("pathContext handles unit 0 and unit ids that contain dashes", () => {
  assert.equal(
    pathContext("/subject/biology/unit-0-abc/chapter/x/y")?.unitId,
    "unit-0",
  );
  assert.equal(
    pathContext("/subject/calculus-ab/unit-10-ab-cd-ef/chapter/x/y")?.unitId,
    "unit-10",
  );
});

test("pathContext is null outside chapter and test pages", () => {
  for (const path of [
    "/admin/subject/biology/xgxskm69/chapter/0kvtm3P4",
    "/admin/subject/biology/xgxskm69/test/dip7d52n",
    "/subject/biology",
    "/subject/biology/unit-1-xgxskm69/frq/abc",
    "/dashboard",
    "/",
  ]) {
    assert.equal(pathContext(path), null, path);
  }
});

const context = { subject: "biology", unitId: "unit-1", refId: "0kvtm3P4" };

test("a saved reading has no questionIndex key and no undefined values", () => {
  const item = buildSavedItem({
    kind: "reading",
    context,
    label: "Structure of Water",
    href: "/subject/biology/unit-1-x/chapter/0kvtm3P4/t",
  });
  assert.equal("questionIndex" in item, false);
  for (const value of Object.values(item)) assert.notEqual(value, undefined);
});

test("a saved question keeps questionIndex 0", () => {
  const item = buildSavedItem({
    kind: "question",
    context,
    questionIndex: 0,
    label: "Q1",
    href: "/subject/biology/unit-1-x/chapter/0kvtm3P4/t",
  });
  assert.equal(item.questionIndex, 0);
});

test("a blank label falls back and a long label is truncated", () => {
  const base = { kind: "reading" as const, context, href: "/subject/x" };
  assert.equal(buildSavedItem({ ...base, label: "   " }).label, "Untitled");
  assert.equal(
    buildSavedItem({ ...base, label: "x".repeat(500) }).label.length,
    200,
  );
});
