import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LEGACY_QUESTION_ID,
  getAllParts,
  getPartLabel,
  getStudentFacingParts,
  getStudentFacingQuestions,
  getTemplatePoints,
  hasResponseText,
  makeId,
  normalizeFrqTemplate,
  stripResponseHtml,
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

test("stripResponseHtml decodes HTML entities, not just strips tags", () => {
  assert.equal(
    stripResponseHtml("<p>Supply &amp; demand shift the curve.</p>"),
    "Supply & demand shift the curve.",
  );
  assert.equal(stripResponseHtml("<p>5 &lt; 10 &gt; 2</p>"), "5 < 10 > 2");
  assert.equal(stripResponseHtml("<p>&quot;quoted&quot;</p>"), '"quoted"');
  assert.equal(stripResponseHtml("<p>caf&#233;</p>"), "café");
  assert.equal(stripResponseHtml("<p>&nbsp;padded&nbsp;</p>"), "padded");
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

  const criteria = out.questions[0]?.parts[0]?.criteria ?? [];

  assert.deepEqual(
    criteria.map((criterion) => criterion.points),
    [1, 0, 0],
  );
});

test("a legacy flat document is wrapped into one question", () => {
  const out = normalizeFrqTemplate(
    {
      title: "Legacy FRQ",
      directions: "Old stimulus",
      questions: [
        { id: "p1", prompt: "Part one" },
        { id: "p2", prompt: "Part two" },
      ],
    },
    { id: "t1", subject: "calc", unitId: "u1" },
  );

  assert.equal(out.questions.length, 1);
  assert.equal(out.questions[0]?.id, "legacy-question");
  assert.equal(out.questions[0]?.stimulus, "");
  assert.deepEqual(
    out.questions[0]?.parts.map((part) => part.id),
    ["p1", "p2"],
  );
  // Exam-wide directions are untouched, which is what makes the legacy render
  // byte-identical to today.
  assert.equal(out.directions, "Old stimulus");
});

test("the legacy wrap id is stable across reads", () => {
  const raw = { questions: [{ id: "p1", prompt: "Part one" }] };
  const identity = { id: "t1", subject: "calc", unitId: "u1" };

  assert.equal(
    normalizeFrqTemplate(raw, identity).questions[0]?.id,
    LEGACY_QUESTION_ID,
  );
  assert.equal(
    normalizeFrqTemplate(raw, identity).questions[0]?.id,
    LEGACY_QUESTION_ID,
  );
});

test("a nested document is read as authored", () => {
  const out = normalizeFrqTemplate(
    {
      title: "Nested FRQ",
      sectionLabel: "Section I, Part B",
      sectionSubtitle: "Short answer",
      questions: [
        {
          id: "q1",
          stimulus: "Graph A",
          parts: [{ id: "p1", prompt: "Part one" }],
        },
        { id: "q2", stimulus: "Table B", parts: [] },
      ],
    },
    { id: "t1", subject: "calc", unitId: "u1" },
  );

  assert.equal(out.questions.length, 2);
  assert.equal(out.questions[0]?.stimulus, "Graph A");
  assert.deepEqual(
    out.questions[0]?.parts.map((part) => part.id),
    ["p1"],
  );
  // An empty parts array is still the new shape, not a legacy document.
  assert.deepEqual(out.questions[1]?.parts, []);
  assert.equal(out.sectionLabel, "Section I, Part B");
  assert.equal(out.sectionSubtitle, "Short answer");
});

test("an unconfigured section heading is absent, not blank", () => {
  const identity = { id: "t1", subject: "calc", unitId: "u1" };

  // A `??` fallback is the shape PR 3 uses to reach the hardcoded default. It
  // only reaches it if the key is missing, so assert the key, not the value.
  const older = normalizeFrqTemplate({ title: "Old FRQ" }, identity);

  assert.equal("sectionLabel" in older, false);
  assert.equal("sectionSubtitle" in older, false);
  assert.equal(older.sectionLabel ?? "Section II", "Section II");

  // A stored blank means the author cleared the field; it reads the same as
  // never having set it, so the two cannot drift apart downstream.
  const blanked = normalizeFrqTemplate(
    { sectionLabel: "", sectionSubtitle: "   " },
    identity,
  );

  assert.equal("sectionLabel" in blanked, false);
  assert.equal("sectionSubtitle" in blanked, false);

  // Non-string junk must not survive as a heading either.
  const junk = normalizeFrqTemplate({ sectionLabel: 42 }, identity);

  assert.equal(junk.sectionLabel, undefined);
});

test("parts with no stable id are dropped in both shapes", () => {
  const identity = { id: "t1", subject: "calc", unitId: "u1" };

  const legacy = normalizeFrqTemplate(
    { questions: [{ id: "p1" }, { prompt: "no id" }] },
    identity,
  );

  const nested = normalizeFrqTemplate(
    { questions: [{ id: "q1", parts: [{ id: "p1" }, { prompt: "no id" }] }] },
    identity,
  );

  assert.deepEqual(
    legacy.questions[0]?.parts.map((part) => part.id),
    ["p1"],
  );
  assert.deepEqual(
    nested.questions[0]?.parts.map((part) => part.id),
    ["p1"],
  );
});

const twoQuestionTemplate = () =>
  normalizeFrqTemplate(
    {
      questions: [
        {
          id: "q1",
          parts: [
            {
              id: "p1",
              criteria: [{ id: "c1", description: "x", points: 2 }],
            },
            { id: "p2", status: "legacy" },
          ],
        },
        {
          id: "q2",
          parts: [
            {
              id: "p3",
              criteria: [{ id: "c2", description: "y", points: 3 }],
            },
          ],
        },
        { id: "q3", parts: [{ id: "p4", status: "legacy" }] },
      ],
    },
    { id: "t1", subject: "calc", unitId: "u1" },
  );

test("getAllParts flattens in reading order and keeps legacy parts", () => {
  assert.deepEqual(
    getAllParts(twoQuestionTemplate()).map((part) => part.id),
    ["p1", "p2", "p3", "p4"],
  );
});

test("getStudentFacingParts drops legacy parts", () => {
  assert.deepEqual(
    getStudentFacingParts(twoQuestionTemplate()).map((part) => part.id),
    ["p1", "p3"],
  );
});

test("getStudentFacingQuestions drops questions with no visible parts", () => {
  const questions = getStudentFacingQuestions(twoQuestionTemplate());

  assert.deepEqual(
    questions.map((question) => question.id),
    ["q1", "q2"],
  );
  assert.deepEqual(
    questions[0]?.parts.map((part) => part.id),
    ["p1"],
  );
});

test("getTemplatePoints sums across questions", () => {
  assert.equal(getTemplatePoints(getAllParts(twoQuestionTemplate())), 5);
});

test("makeId is prefixed and collision-safe within a millisecond", () => {
  const ids = new Set(Array.from({ length: 500 }, () => makeId("part")));

  assert.equal(ids.size, 500);
  assert.ok([...ids].every((id) => id.startsWith("part-")));
});

test("one malformed entry does not discard other questions' parts", () => {
  const out = normalizeFrqTemplate(
    {
      questions: [
        { id: "q1", parts: [{ id: "p1", prompt: "kept" }] },
        { id: "stray", prompt: "no parts array" },
      ],
    },
    { id: "t1", subject: "calc", unitId: "u1" },
  );

  assert.deepEqual(
    out.questions.map((question) => question.id),
    ["q1", "stray"],
  );
  assert.deepEqual(
    out.questions[0]?.parts.map((part) => part.id),
    ["p1"],
  );
  assert.deepEqual(out.questions[1]?.parts, []);
});

test("a null parts field does not reclassify the whole document", () => {
  const out = normalizeFrqTemplate(
    {
      questions: [
        { id: "q1", parts: null },
        { id: "q2", parts: [{ id: "p1", prompt: "kept" }] },
      ],
    },
    { id: "t1", subject: "calc", unitId: "u1" },
  );

  assert.deepEqual(out.questions[0]?.parts, []);
  assert.deepEqual(
    out.questions[1]?.parts.map((part) => part.id),
    ["p1"],
  );
});

test("a legacy document with a stray non-object entry keeps its parts", () => {
  const out = normalizeFrqTemplate(
    {
      directions: "Old stimulus",
      questions: [null, { id: "p1", prompt: "kept" }, "junk"],
    },
    { id: "t1", subject: "calc", unitId: "u1" },
  );

  assert.equal(out.questions.length, 1);
  assert.equal(out.questions[0]?.id, LEGACY_QUESTION_ID);
  assert.deepEqual(
    out.questions[0]?.parts.map((part) => part.id),
    ["p1"],
  );
});
