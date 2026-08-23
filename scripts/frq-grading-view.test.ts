import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LEGACY_QUESTION_ID,
  getAllParts,
  normalizeFrqTemplate,
} from "../src/lib/frq/template.ts";
import { buildStudentQuestions } from "../src/lib/frq/studentView.ts";
import {
  buildGradingQuestions,
  buildStoredGrades,
  clampCriterionPoints,
  countGradedParts,
  createEmptyGrades,
  findGradingQuestionIndexForPart,
  getEarnedPoints,
  getGradingParts,
  getPartEarnedPoints,
  getQuestionLabel,
} from "../src/lib/frq/gradingView.ts";
import type { PartGrade } from "../src/lib/frq/gradingView.ts";

const identity = { id: "t1", subject: "calc", unitId: "u1" };

const criterion = (id: string, points: number) => ({
  id,
  description: `criterion ${id}`,
  points,
});

/** Two questions. The second holds a part that has since been retired. */
const twoQuestionTemplate = () =>
  normalizeFrqTemplate(
    {
      directions: "Exam-wide directions",
      questions: [
        {
          id: "q1",
          stimulus: "Stimulus for question one",
          parts: [
            { id: "p1", prompt: "one A", criteria: [criterion("c1", 2)] },
            { id: "p2", prompt: "one B", criteria: [criterion("c2", 3)] },
          ],
        },
        {
          id: "q2",
          stimulus: "Stimulus for question two",
          parts: [
            { id: "p3", prompt: "two A", criteria: [criterion("c3", 1)] },
            {
              id: "p4",
              prompt: "two B",
              status: "legacy",
              criteria: [criterion("c4", 4)],
            },
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
        { id: "p1", prompt: "first", criteria: [criterion("c1", 2)] },
        { id: "p2", prompt: "second", criteria: [criterion("c2", 2)] },
        { id: "p3", prompt: "third", criteria: [criterion("c3", 2)] },
      ],
    },
    identity,
  );

test("grading keeps the retired parts the student view drops", () => {
  // The whole reason grading cannot reuse `buildStudentQuestions`. A response
  // written while p4 was public is still stored under p4, so a grader who
  // cannot reach it cannot score it.
  const template = twoQuestionTemplate();

  assert.deepEqual(
    getGradingParts(buildGradingQuestions(template)).map((part) => part.id),
    ["p1", "p2", "p3", "p4"],
  );

  assert.deepEqual(
    buildStudentQuestions(template).flatMap((question) =>
      question.parts.map(({ part }) => part.id),
    ),
    ["p1", "p2", "p3"],
  );
});

test("question paging exposes exactly the parts the flat list did", () => {
  // The guard against this change losing a part. `getAllParts` is what the
  // renderer paged through before, so the new model flattening to the same ids
  // in the same order is what "grades the same submission" means.
  for (const template of [twoQuestionTemplate(), legacyFlatTemplate()]) {
    assert.deepEqual(
      getGradingParts(buildGradingQuestions(template)).map((part) => part.id),
      getAllParts(template).map((part) => part.id),
    );
  }
});

test("part labels restart at A inside every question", () => {
  assert.deepEqual(
    buildGradingQuestions(twoQuestionTemplate()).map((question) =>
      question.parts.map((entry) => entry.label),
    ),
    [
      ["A", "B"],
      ["A", "B"],
    ],
  );
});

test("a legacy flat document grades as one question holding every part", () => {
  const questions = buildGradingQuestions(legacyFlatTemplate());

  assert.equal(questions.length, 1);
  assert.equal(questions[0]?.id, LEGACY_QUESTION_ID);
  assert.deepEqual(
    questions[0]?.parts.map((entry) => entry.part.id),
    ["p1", "p2", "p3"],
  );
  // Labels match what the flat grading page printed for the same document.
  assert.deepEqual(
    questions[0]?.parts.map((entry) => entry.label),
    ["A", "B", "C"],
  );
});

test("a question with no parts is not a page the grader can reach", () => {
  const template = normalizeFrqTemplate(
    {
      questions: [
        { id: "q1", parts: [{ id: "p1", prompt: "scorable" }] },
        { id: "q2", parts: [] },
      ],
    },
    identity,
  );

  assert.deepEqual(
    buildGradingQuestions(template).map((question) => question.id),
    ["q1"],
  );
});

test("a retired part still resolves to its question page", () => {
  const questions = buildGradingQuestions(twoQuestionTemplate());

  assert.equal(findGradingQuestionIndexForPart(questions, "p1"), 0);
  assert.equal(findGradingQuestionIndexForPart(questions, "p3"), 1);
  // p4 is legacy. The student view reports -1 for it; grading must not.
  assert.equal(findGradingQuestionIndexForPart(questions, "p4"), 1);
  assert.equal(findGradingQuestionIndexForPart(questions, "never-existed"), -1);
});

test("a one-question exam carries no question number", () => {
  assert.equal(getQuestionLabel(1, 0), null);
  assert.equal(getQuestionLabel(3, 0), "Question 1");
  assert.equal(getQuestionLabel(3, 2), "Question 3");
});

test("a grade saved against a part id survives the restructure", () => {
  // The invariant most likely to break here. Grades are built the way the flat
  // renderer built them, then tallied through the question model: both totals
  // and the stored array have to come out identical.
  const template = twoQuestionTemplate();
  const flatParts = getAllParts(template);
  const questionParts = getGradingParts(buildGradingQuestions(template));

  const grades: Record<string, PartGrade> = {
    p1: { feedback: "solid", criteria: { c1: 2 } },
    p2: { feedback: "partial", criteria: { c2: 1 } },
    p3: { feedback: "", criteria: { c3: 1 } },
    p4: { feedback: "retired but answered", criteria: { c4: 3 } },
  };

  assert.equal(getEarnedPoints(flatParts, grades), 7);
  assert.equal(
    getEarnedPoints(questionParts, grades),
    getEarnedPoints(flatParts, grades),
  );
  assert.deepEqual(
    buildStoredGrades(questionParts, grades),
    buildStoredGrades(flatParts, grades),
  );
});

test("stored grades key on part id, not on question id", () => {
  const template = twoQuestionTemplate();
  const parts = getGradingParts(buildGradingQuestions(template));
  const stored = buildStoredGrades(parts, {
    p2: { feedback: "  trimmed  ", criteria: { c2: 2 } },
  });

  assert.deepEqual(
    stored.map((grade) => grade.questionId),
    ["p1", "p2", "p3", "p4"],
  );
  // Not "q1": the field name says question, the value is a part.
  assert.equal(stored[1]?.questionId, "p2");
  assert.equal(stored[1]?.feedback, "trimmed");
  assert.deepEqual(stored[1]?.criteria, [{ criterionId: "c2", points: 2 }]);
  // An ungraded part still gets a row, so the student sees the whole rubric.
  assert.deepEqual(stored[0]?.criteria, [{ criterionId: "c1", points: 0 }]);
});

test("an empty grade covers every part and every criterion at zero", () => {
  const parts = getGradingParts(buildGradingQuestions(twoQuestionTemplate()));
  const grades = createEmptyGrades(parts);

  assert.deepEqual(Object.keys(grades), ["p1", "p2", "p3", "p4"]);
  assert.deepEqual(grades.p4, { feedback: "", criteria: { c4: 0 } });
  assert.equal(getEarnedPoints(parts, grades), 0);
});

test("points awarded to a deleted criterion stop counting", () => {
  const [part] = getGradingParts(buildGradingQuestions(twoQuestionTemplate()));

  assert.ok(part);
  // c1 is on the rubric, c-removed is not, so only c1's 2 points count.
  assert.equal(
    getPartEarnedPoints(part, {
      feedback: "",
      criteria: { c1: 2, "c-removed": 5 },
    }),
    2,
  );
});

test("a part counts as graded once it has a note, not once it has points", () => {
  const parts = getGradingParts(buildGradingQuestions(twoQuestionTemplate()));

  assert.equal(
    countGradedParts(parts, {
      p1: { feedback: "read it", criteria: { c1: 0 } },
      p2: { feedback: "   ", criteria: { c2: 3 } },
    }),
    1,
  );
});

test("a typed score is clamped to what the criterion can award", () => {
  assert.equal(clampCriterionPoints(9, 3), 3);
  assert.equal(clampCriterionPoints(-2, 3), 0);
  assert.equal(clampCriterionPoints(1.6, 3), 2);
  // An empty number input reads back as NaN.
  assert.equal(clampCriterionPoints(Number.NaN, 3), 0);
});
