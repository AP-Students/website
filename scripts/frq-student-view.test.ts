import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LEGACY_QUESTION_ID,
  getStudentFacingParts,
  normalizeFrqTemplate,
} from "../src/lib/frq/template.ts";
import {
  buildStudentQuestions,
  findQuestionIndexForPart,
  getResponsePartIds,
  getSectionHeading,
} from "../src/lib/frq/studentView.ts";

const identity = { id: "t1", subject: "calc", unitId: "u1" };

/** Two questions, each with a public part and a legacy one. */
const twoQuestionTemplate = () =>
  normalizeFrqTemplate(
    {
      directions: "Exam-wide directions",
      questions: [
        {
          id: "q1",
          stimulus: "Stimulus for question one",
          parts: [
            { id: "p1", prompt: "one A" },
            { id: "p2", prompt: "one B" },
          ],
        },
        {
          id: "q2",
          stimulus: "Stimulus for question two",
          parts: [
            { id: "p3", prompt: "two A" },
            { id: "p4", prompt: "two B", status: "legacy" },
          ],
        },
      ],
    },
    identity,
  );

/** The pre-split shape: a flat part list stored under `questions`. */
const legacyFlatTemplate = () =>
  normalizeFrqTemplate(
    {
      directions: "Old stimulus",
      questions: [
        { id: "p1", prompt: "first" },
        { id: "p2", prompt: "second" },
        { id: "p3", prompt: "third" },
      ],
    },
    identity,
  );

test("part labels restart at A inside every question", () => {
  const questions = buildStudentQuestions(twoQuestionTemplate());

  assert.deepEqual(
    questions.map((question) => question.parts.map((entry) => entry.label)),
    [["A", "B"], ["A"]],
  );
});

test("a question whose parts are all legacy is not reachable", () => {
  const template = normalizeFrqTemplate(
    {
      questions: [
        { id: "q1", parts: [{ id: "p1", prompt: "visible" }] },
        {
          id: "q2",
          parts: [
            { id: "p2", prompt: "hidden", status: "legacy" },
            { id: "p3", prompt: "also hidden", status: "legacy" },
          ],
        },
        { id: "q3", parts: [{ id: "p4", prompt: "visible" }] },
      ],
    },
    identity,
  );

  const questions = buildStudentQuestions(template);

  assert.deepEqual(
    questions.map((question) => question.id),
    ["q1", "q3"],
  );
  // The dropped question must not leave a gap the footer would page into.
  assert.equal(questions.length, 2);
});

test("a legacy flat document renders as one question holding every part", () => {
  const template = legacyFlatTemplate();
  const questions = buildStudentQuestions(template);

  assert.equal(questions.length, 1);
  assert.equal(questions[0]?.id, LEGACY_QUESTION_ID);
  assert.deepEqual(
    questions[0]?.parts.map((entry) => entry.part.id),
    ["p1", "p2", "p3"],
  );
  // Labels match what the flat renderer printed for the same document.
  assert.deepEqual(
    questions[0]?.parts.map((entry) => entry.label),
    ["A", "B", "C"],
  );
  // The wrap carries no stimulus of its own: the exam-wide directions were
  // always where a legacy document's stimulus lived, and stay there.
  assert.equal(questions[0]?.stimulus, "");
  assert.equal(template.directions, "Old stimulus");
});

test("question paging exposes exactly the parts the flat list did", () => {
  // The guard against this whole change losing a part. `getStudentFacingParts`
  // is what the renderer paged through before, so the new model flattening to
  // the same ids in the same order is what "renders the same as today" means.
  for (const template of [twoQuestionTemplate(), legacyFlatTemplate()]) {
    assert.deepEqual(
      getResponsePartIds(buildStudentQuestions(template)),
      getStudentFacingParts(template).map((part) => part.id),
    );
  }
});

test("response keys are part ids in reading order", () => {
  assert.deepEqual(
    getResponsePartIds(buildStudentQuestions(twoQuestionTemplate())),
    ["p1", "p2", "p3"],
  );
});

test("a part resolves to the question page it sits on", () => {
  const questions = buildStudentQuestions(twoQuestionTemplate());

  assert.equal(findQuestionIndexForPart(questions, "p1"), 0);
  assert.equal(findQuestionIndexForPart(questions, "p2"), 0);
  assert.equal(findQuestionIndexForPart(questions, "p3"), 1);
});

test("a legacy part has no question page and reports -1", () => {
  const questions = buildStudentQuestions(twoQuestionTemplate());

  // p4 is legacy, so a stale shortcut to it must not resolve to question 1.
  assert.equal(findQuestionIndexForPart(questions, "p4"), -1);
  assert.equal(findQuestionIndexForPart(questions, "never-existed"), -1);
});

test("an unconfigured template keeps both original headings verbatim", () => {
  const heading = getSectionHeading(normalizeFrqTemplate({}, identity));

  assert.equal(heading.label, "Section II");
  assert.equal(heading.subtitle, "Free response");
  assert.equal(heading.reviewHeading, "Section II: Free-Response Questions");
});

test("a configured section heading replaces both sites", () => {
  const heading = getSectionHeading(
    normalizeFrqTemplate(
      { sectionLabel: "Section I, Part B", sectionSubtitle: "Short answer" },
      identity,
    ),
  );

  assert.equal(heading.label, "Section I, Part B");
  assert.equal(heading.subtitle, "Short answer");
  assert.equal(heading.reviewHeading, "Section I, Part B: Short answer");
});

test("a half-configured heading falls back per field, never to a blank", () => {
  const labelOnly = getSectionHeading(
    normalizeFrqTemplate({ sectionLabel: "Section III" }, identity),
  );

  assert.equal(labelOnly.subtitle, "Free response");
  assert.equal(labelOnly.reviewHeading, "Section III: Free-Response Questions");

  // A stored blank collapses to absent in normalization, so the fallback wins
  // rather than rendering an empty heading.
  const blank = getSectionHeading(
    normalizeFrqTemplate(
      { sectionLabel: "   ", sectionSubtitle: "" },
      identity,
    ),
  );

  assert.equal(blank.label, "Section II");
  assert.equal(blank.reviewHeading, "Section II: Free-Response Questions");
});

test("a question's stimulus stays separate from the exam-wide directions", () => {
  const template = twoQuestionTemplate();
  const questions = buildStudentQuestions(template);

  assert.equal(template.directions, "Exam-wide directions");
  assert.equal(questions[0]?.stimulus, "Stimulus for question one");
  assert.equal(questions[1]?.stimulus, "Stimulus for question two");
});
