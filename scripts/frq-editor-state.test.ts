import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildInitialState,
  buildTemplatePayload,
  canMovePart,
  movePart,
} from "../src/lib/frq/editorState.ts";
import { normalizeFrqTemplate } from "../src/lib/frq/template.ts";

const identity = { id: "t1", subject: "calc", unitId: "u1" };

/** Two questions, each with its own stimulus: what PR 2 lets authors build. */
const nestedDocument = {
  title: "Unit 4 FRQ",
  directions: "<p>Answer both questions.</p>",
  sectionLabel: "Section I, Part B",
  sectionSubtitle: "Short answer",
  timeLimitMinutes: 40,
  isPublic: true,
  questions: [
    {
      id: "q1",
      stimulus: "<p>The graph shows velocity over time.</p>",
      stimulusFiles: [{ key: "graph.png", name: "graph.png" }],
      parts: [
        {
          id: "part-a",
          title: "A",
          prompt: "<p>Find the acceleration.</p>",
          status: "public",
          criteria: [{ id: "c1", description: "Correct value", points: 2 }],
        },
        {
          id: "part-b",
          title: "B",
          prompt: "<p>Justify your answer.</p>",
          answerType: "equation",
          status: "public",
          criteria: [],
        },
      ],
    },
    {
      id: "q2",
      stimulus: "<p>A second source.</p>",
      parts: [
        {
          id: "part-c",
          title: "A",
          prompt: "<p>Compare the two.</p>",
          status: "public",
          criteria: [{ id: "c2", description: "Names both", points: 1 }],
        },
      ],
    },
  ],
};

const openEditor = (raw: unknown) =>
  buildInitialState(normalizeFrqTemplate(raw, identity));

test("a multi-question document survives load -> save -> reload", () => {
  const saved = buildTemplatePayload(openEditor(nestedDocument));
  const reloaded = normalizeFrqTemplate(saved, identity);

  // The property PR 1's editor could not hold: two questions stay two
  // questions, each keeping its own stimulus and its own parts.
  assert.equal(reloaded.questions.length, 2);
  assert.equal(
    reloaded.questions[0]?.stimulus,
    "<p>The graph shows velocity over time.</p>",
  );
  assert.equal(reloaded.questions[1]?.stimulus, "<p>A second source.</p>");
  assert.deepEqual(
    reloaded.questions.map((question) => question.parts.map((part) => part.id)),
    [["part-a", "part-b"], ["part-c"]],
  );
  assert.deepEqual(
    reloaded.questions[0]?.stimulusFiles?.map((file) => file.key),
    ["graph.png"],
  );
});

test("part labels restart at A inside every question", () => {
  const saved = buildTemplatePayload(openEditor(nestedDocument));

  assert.deepEqual(
    saved.questions.map((question) => question.parts.map((part) => part.title)),
    [["A", "B"], ["A"]],
  );
});

test("a section heading round trips, and a blank one is not stored", () => {
  const configured = buildTemplatePayload(openEditor(nestedDocument));

  assert.equal(configured.sectionLabel, "Section I, Part B");
  assert.equal(configured.sectionSubtitle, "Short answer");

  // An untouched heading saves as "", which the editor writes as a field
  // delete so the reloaded template falls back rather than showing a blank.
  const untouched = buildTemplatePayload(openEditor({ title: "No heading" }));

  assert.equal(untouched.sectionLabel, "");
  assert.equal(
    normalizeFrqTemplate({ ...untouched, sectionLabel: undefined }, identity)
      .sectionLabel,
    undefined,
  );
});

test("moving a part down past the last one enters the next question", () => {
  const state = openEditor(nestedDocument);
  const moved = movePart(state.questions, "part-b", 1);

  // part-b leaves question 1 and lands at the START of question 2, so it keeps
  // its place in reading order rather than jumping behind part-c.
  assert.deepEqual(
    moved.map((question) => question.parts.map((part) => part.id)),
    [["part-a"], ["part-b", "part-c"]],
  );
});

test("moving a part up past the first one enters the previous question", () => {
  const state = openEditor(nestedDocument);
  const moved = movePart(state.questions, "part-c", -1);

  // Moving up lands at the END of the question above, again preserving order.
  assert.deepEqual(
    moved.map((question) => question.parts.map((part) => part.id)),
    [["part-a", "part-b", "part-c"], []],
  );
});

test("a moved part keeps the id and rubric its grades resolve through", () => {
  const state = openEditor(nestedDocument);
  const before = state.questions[0]?.parts[0];
  const moved = movePart(state.questions, "part-a", 1);
  const after = moved[0]?.parts.find((part) => part.id === "part-a");

  // Same object, so the id every stored response and grade is keyed by is
  // untouched. Rebuilding the part here would orphan its submissions.
  assert.equal(after, before);
  assert.deepEqual(
    after?.criteria.map((criterion) => criterion.points),
    [2],
  );

  // Only its label changes, and only because labels are positional.
  const saved = buildTemplatePayload({ ...state, questions: moved });

  assert.deepEqual(
    saved.questions[0]?.parts.map((part) => [part.id, part.title]),
    [
      ["part-b", "A"],
      ["part-a", "B"],
    ],
  );
});

test("moving within a question swaps neighbours without leaving it", () => {
  const state = openEditor(nestedDocument);
  const moved = movePart(state.questions, "part-a", 1);

  assert.deepEqual(
    moved.map((question) => question.parts.map((part) => part.id)),
    [["part-b", "part-a"], ["part-c"]],
  );
});

test("the first and last parts of the exam have nowhere further to go", () => {
  const { questions } = openEditor(nestedDocument);

  assert.equal(canMovePart(questions, "part-a", -1), false);
  assert.equal(canMovePart(questions, "part-c", 1), false);

  assert.equal(canMovePart(questions, "part-a", 1), true);
  assert.equal(canMovePart(questions, "part-b", -1), true);
  assert.equal(canMovePart(questions, "part-c", -1), true);

  // A part that is not in the exam cannot move, and moving it is a no-op
  // rather than a crash.
  assert.equal(canMovePart(questions, "missing", 1), false);
  assert.equal(movePart(questions, "missing", 1), questions);
});

test("moving off either end of the exam changes nothing", () => {
  const { questions } = openEditor(nestedDocument);

  assert.equal(movePart(questions, "part-a", -1), questions);
  assert.equal(movePart(questions, "part-c", 1), questions);
});

test("a legacy document opens as one editable question", () => {
  const state = openEditor({
    title: "Old FRQ",
    directions: "<p>Old stimulus.</p>",
    questions: [
      { id: "p1", title: "A", prompt: "<p>One.</p>" },
      { id: "p2", title: "B", prompt: "<p>Two.</p>" },
    ],
  });

  assert.equal(state.questions.length, 1);
  assert.deepEqual(
    state.questions[0]?.parts.map((part) => part.id),
    ["p1", "p2"],
  );
  // Exam-wide directions stay exam-wide; the wrap does not steal them into the
  // question's stimulus, which is what keeps the legacy render unchanged.
  assert.equal(state.description.question.value, "<p>Old stimulus.</p>");
  assert.equal(state.questions[0]?.stimulus.question.value, "");
});

test("an FRQ with no questions still opens with somewhere to add a part", () => {
  const state = openEditor({ title: "Empty FRQ" });

  assert.equal(state.questions.length, 1);
  assert.deepEqual(state.questions[0]?.parts, []);

  // An empty question saves as the nested shape, not as a legacy document.
  const reloaded = normalizeFrqTemplate(buildTemplatePayload(state), identity);

  assert.equal(reloaded.questions.length, 1);
  assert.deepEqual(reloaded.questions[0]?.parts, []);
});
