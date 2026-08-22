import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getPartLabel,
  hasResponseText,
  normalizeFrqTemplate,
} from "../src/lib/frq/template.ts";

test("part labels do not walk off the alphabet", () => {
  assert.equal(getPartLabel(0), "A");
  assert.equal(getPartLabel(25), "Z");
  assert.equal(getPartLabel(26), "AA");
});

test("hasResponseText ignores markup-only responses", () => {
  assert.equal(hasResponseText("<p></p>"), false);
  assert.equal(hasResponseText("<p>&nbsp;</p>"), false);
  assert.equal(hasResponseText("<p>an answer</p>"), true);
  assert.equal(hasResponseText(undefined), false);
});

test("a malformed document degrades instead of throwing", () => {
  const out = normalizeFrqTemplate(null, {
    id: "t1",
    subject: "calc",
    unitId: "u1",
  });

  assert.equal(out.title, "Untitled FRQ");
  assert.equal(out.subject, "calc");
  assert.deepEqual(out.questions, []);
  assert.equal(out.timeLimitMinutes, 90);
});

test("criteria points are clamped to whole non-negative numbers", () => {
  const out = normalizeFrqTemplate(
    {
      questions: [
        {
          id: "p1",
          criteria: [
            { id: "c1", description: "half", points: 1.4 },
            { id: "c2", description: "negative", points: -3 },
            { id: "c3", description: "junk", points: "abc" },
          ],
        },
      ],
    },
    { id: "t1", subject: "calc", unitId: "u1" },
  );

  const criteria = out.questions[0]?.criteria ?? [];

  assert.deepEqual(
    criteria.map((criterion) => criterion.points),
    [1, 0, 0],
  );
});
