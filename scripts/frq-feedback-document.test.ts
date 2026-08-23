import assert from "node:assert/strict";
import { test } from "node:test";
import type { Timestamp } from "firebase/firestore";
import type { GradedFRQSubmission } from "../src/types/frq.ts";
import { buildFeedbackDocument } from "../src/lib/frq/feedbackDocument.ts";
import { getAllParts, normalizeFrqTemplate } from "../src/lib/frq/template.ts";

const identity = { id: "t1", subject: "calc", unitId: "u1" };

const criterion = (id: string, points: number) => ({
  id,
  description: `criterion ${id}`,
  points,
});

/** Only `toDate` is read, so a stub stands in for a real Firestore value. */
const timestamp = (iso: string) =>
  ({ toDate: () => new Date(iso) }) as unknown as Timestamp;

const twoQuestionTemplate = () =>
  normalizeFrqTemplate(
    {
      title: "Unit 3 FRQ",
      directions: "Exam-wide directions",
      questions: [
        {
          id: "q1",
          stimulus: "Stimulus for question one",
          parts: [
            { id: "p1", title: "Part one", criteria: [criterion("c1", 2)] },
            { id: "p2", title: "Part two", criteria: [criterion("c2", 3)] },
          ],
        },
        {
          id: "q2",
          stimulus: "Stimulus for question two",
          parts: [
            { id: "p3", title: "Part three", criteria: [criterion("c3", 1)] },
            {
              id: "p4",
              title: "Part four",
              status: "legacy",
              criteria: [criterion("c4", 4)],
            },
          ],
        },
      ],
    },
    identity,
  );

const legacyFlatTemplate = () =>
  normalizeFrqTemplate(
    {
      title: "Old FRQ",
      directions: "Old stimulus",
      questions: [
        { id: "p1", title: "First", criteria: [criterion("c1", 2)] },
        { id: "p2", title: "Second", criteria: [criterion("c2", 2)] },
      ],
    },
    identity,
  );

const gradedSubmission = (
  overrides: Partial<GradedFRQSubmission> = {},
): GradedFRQSubmission =>
  ({
    id: "s1",
    sourceSubmissionId: "s1",
    templateId: "t1",
    subject: "calc",
    unitId: "u1",
    studentId: "student-1",
    graderId: "grader-1",
    score: "3/10",
    feedback: "Overall note",
    responses: {
      p1: "answer one",
      p2: "answer two",
      p3: "answer three",
      p4: "answer four",
    },
    grades: [
      {
        questionId: "p1",
        feedback: "solid",
        criteria: [{ criterionId: "c1", points: 2 }],
      },
      {
        questionId: "p4",
        feedback: "retired but answered",
        criteria: [{ criterionId: "c4", points: 1 }],
      },
    ],
    submittedAt: timestamp("2026-08-01T10:00:00Z"),
    gradedAt: timestamp("2026-08-02T10:00:00Z"),
    ...overrides,
  }) as GradedFRQSubmission;

test("the document holds one entry per question, not one for the exam", () => {
  // The hardcoded single-entry array is what made a two-question FRQ print
  // both questions' parts on one page under one stimulus.
  const document = buildFeedbackDocument(
    gradedSubmission(),
    twoQuestionTemplate(),
  );

  assert.deepEqual(
    document.frqs.map((frq) => frq.id),
    ["q1", "q2"],
  );
  assert.deepEqual(
    document.frqs.map((frq) => frq.questions.map((part) => part.id)),
    [
      ["p1", "p2"],
      ["p3", "p4"],
    ],
  );
});

test("every part appears exactly once across the questions", () => {
  // The guard against the regrouping dropping or duplicating a part.
  const template = twoQuestionTemplate();
  const document = buildFeedbackDocument(gradedSubmission(), template);

  assert.deepEqual(
    document.frqs.flatMap((frq) => frq.questions.map((part) => part.id)),
    getAllParts(template).map((part) => part.id),
  );
});

test("a legacy flat document still renders as one page named for the exam", () => {
  const document = buildFeedbackDocument(
    gradedSubmission({ responses: { p1: "answer one", p2: "answer two" } }),
    legacyFlatTemplate(),
  );

  assert.equal(document.frqs.length, 1);
  assert.equal(document.frqs[0]?.name, "Old FRQ");
  assert.deepEqual(
    document.frqs[0]?.questions.map((part) => part.id),
    ["p1", "p2"],
  );
});

test("a multi-question exam names each page by its number", () => {
  const document = buildFeedbackDocument(
    gradedSubmission(),
    twoQuestionTemplate(),
  );

  assert.deepEqual(
    document.frqs.map((frq) => frq.name),
    ["Question 1", "Question 2"],
  );
  // The exam title is still carried, and the footer prints it on every page.
  assert.equal(document.name, "Unit 3 FRQ");
});

test("exam-wide directions and a question's stimulus stay separate", () => {
  const document = buildFeedbackDocument(
    gradedSubmission(),
    twoQuestionTemplate(),
  );

  // Repointing `description` at the stimulus would have deleted the directions
  // from every feedback page already in the database.
  assert.equal(document.frqs[0]?.description.value, "Exam-wide directions");
  assert.equal(document.frqs[1]?.description.value, "Exam-wide directions");

  assert.equal(document.frqs[0]?.stimulus?.value, "Stimulus for question one");
  assert.equal(document.frqs[1]?.stimulus?.value, "Stimulus for question two");
});

test("scores and responses stay one flat list keyed by part id", () => {
  const document = buildFeedbackDocument(
    gradedSubmission(),
    twoQuestionTemplate(),
  );

  assert.deepEqual(
    document.feedback.questions.map((entry) => entry.questionId),
    ["p1", "p2", "p3", "p4"],
  );
  assert.deepEqual(
    document.response.answers.map((entry) => entry.questionId),
    ["p1", "p2", "p3", "p4"],
  );
});

test("a grade stored under a part id still resolves after the regrouping", () => {
  const document = buildFeedbackDocument(
    gradedSubmission(),
    twoQuestionTemplate(),
  );

  const graded = document.feedback.questions.find(
    (entry) => entry.questionId === "p1",
  );

  assert.equal(graded?.feedback, "solid");
  assert.deepEqual(graded?.gradingCriteria, [{ criterionId: "c1", points: 2 }]);

  // p4 is legacy and now sits under question 2. The student was graded on it,
  // so the score has to survive the move.
  const retired = document.feedback.questions.find(
    (entry) => entry.questionId === "p4",
  );

  assert.equal(retired?.feedback, "retired but answered");
  assert.deepEqual(retired?.gradingCriteria, [
    { criterionId: "c4", points: 1 },
  ]);
  assert.equal(
    document.response.answers.find((entry) => entry.questionId === "p4")?.value,
    "answer four",
  );
});

test("an ungraded part still shows its whole rubric at zero", () => {
  const document = buildFeedbackDocument(
    gradedSubmission(),
    twoQuestionTemplate(),
  );

  // p2 has no stored grade at all.
  const ungraded = document.feedback.questions.find(
    (entry) => entry.questionId === "p2",
  );

  assert.equal(ungraded?.feedback, "");
  assert.deepEqual(ungraded?.gradingCriteria, [
    { criterionId: "c2", points: 0 },
  ]);
});

test("a part with no stored response reads as empty, not as missing", () => {
  const document = buildFeedbackDocument(
    gradedSubmission({ responses: { p1: "answer one" } }),
    twoQuestionTemplate(),
  );

  assert.equal(
    document.response.answers.find((entry) => entry.questionId === "p3")?.value,
    "",
  );
});
