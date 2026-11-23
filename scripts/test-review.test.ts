import assert from "node:assert/strict";
import { test } from "node:test";
import {
  gradeAttempt,
  isAnswerCorrect,
  questionFingerprint,
  reviewAttempt,
  testAttemptKey,
} from "../src/lib/testReview.ts";
import { completedTestKey } from "../src/lib/server/testCompletion.ts";

const input = (value: string) => ({ value, files: [] });
const mcq = (answers: string[], ids = ["1", "2", "3", "4"]) => ({
  type: "mcq",
  question: input("Pick one"),
  options: ids.map((id) => ({ id, value: input(`option ${id}`) })),
  answers,
});

test("answers are option positions, so an added fifth option grades right", () => {
  // Added options get timestamp ids, not "5".
  const question = mcq(["5"], ["1", "2", "3", "4", "1716000000000"]);
  assert.equal(isAnswerCorrect(question, ["1716000000000"]), true);
  assert.equal(isAnswerCorrect(question, ["5"]), false);
});

test("multi-answer needs exactly the right options", () => {
  const question = { ...mcq(["1", "3"]), type: "multi-answer" };
  assert.equal(isAnswerCorrect(question, ["1", "3"]), true);
  assert.equal(isAnswerCorrect(question, ["3", "1"]), true);
  assert.equal(isAnswerCorrect(question, ["1"]), false);
  assert.equal(isAnswerCorrect(question, ["1", "3", "4"]), false);
  assert.equal(isAnswerCorrect(question, ["1", "1"]), false);
});

test("free response and questions without an answer key aren't graded", () => {
  const results = gradeAttempt(
    [
      mcq(["2"]),
      { type: "frq", question: input("Explain"), options: [], answers: [] },
      mcq([]),
      mcq(["9"]), // past the last option
    ],
    { 0: ["2"] },
  );
  assert.deepEqual(
    results.map((r) => r.gradable),
    [true, false, false, false],
  );
  assert.equal(results[0]!.correct, true);
});

test("bad data from Firestore doesn't throw", () => {
  assert.equal(isAnswerCorrect({ type: "mcq" }, ["1"]), false);
  assert.equal(
    isAnswerCorrect({ type: "mcq", options: "x", answers: 3 }, []),
    false,
  );
  assert.deepEqual(gradeAttempt([{}], {}), [
    { gradable: false, correct: false },
  ]);
});

test("the fingerprint changes when what the student saw or the key changes", () => {
  const base = mcq(["2"]);
  const same = questionFingerprint(base);
  assert.equal(questionFingerprint(mcq(["2"])), same);
  assert.match(same, /^[0-9a-f]{8}$/);
  assert.notEqual(
    questionFingerprint({ ...base, question: input("Pick two") }),
    same,
  );
  assert.notEqual(questionFingerprint(mcq(["3"])), same);
  assert.notEqual(questionFingerprint(mcq(["2"], ["1", "2", "3", "5"])), same);
  // An edited explanation or topic doesn't matter for lining answers up.
  assert.equal(
    questionFingerprint({
      ...base,
      explanation: input("new"),
      topic: "2.1",
    } as never),
    same,
  );
});

test("the review lines the saved answers up with the questions", () => {
  const questions = [mcq(["2"]), mcq(["1"]), mcq(["3"])];
  const attempt = {
    answers: { "0": ["2"], "1": ["4"] },
    fingerprints: questions.map(questionFingerprint),
  };
  const items = reviewAttempt(questions, attempt);
  assert.deepEqual(
    items.map((i) => [i.chosen, i.correct, i.changed]),
    [
      [["2"], true, false],
      [["4"], false, false],
      [[], false, false], // skipped
    ],
  );
  assert.deepEqual(items[1]!.correctIds, ["1"]);
});

test("an edited question is flagged and its old answer isn't shown", () => {
  const before = [mcq(["2"]), mcq(["1"])];
  const attempt = {
    answers: { "0": ["2"], "1": ["1"] },
    fingerprints: before.map(questionFingerprint),
  };
  const after = [mcq(["3"]), mcq(["1"]), mcq(["4"])]; // q1 changed, q3 added
  const items = reviewAttempt(after, attempt);
  assert.deepEqual(
    items.map((i) => [i.changed, i.chosen]),
    [
      [true, []],
      [false, ["1"]],
      [true, []],
    ],
  );
  assert.equal(items[0]!.correct, false);
});

test("a malformed saved attempt shows every question as changed", () => {
  const items = reviewAttempt([mcq(["1"])], { answers: "x", fingerprints: 4 });
  assert.equal(items[0]!.changed, true);
  assert.deepEqual(items[0]!.chosen, []);
});

test("attempts are filed under the same key as completion receipts", () => {
  const id = { subject: "ap-biology", unitId: "u1", testId: "t1" };
  assert.equal(testAttemptKey(id), completedTestKey(id));
});
