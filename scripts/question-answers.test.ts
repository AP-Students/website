import assert from "node:assert/strict";
import { test } from "node:test";
import {
  answersAfterOptionRemoved,
  correctOptionIds,
  missingOptionPositions,
} from "../src/lib/questionAnswers.ts";

/** Options the way the editor makes them: four starters, then timestamp ids. */
const starterOptions = [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }];
const fiveOptions = [...starterOptions, { id: "1730000000000" }];

test("an added fifth option is found by its position (#294)", () => {
  // The author types "5" for Option 5, but its id is a timestamp, not "5".
  assert.deepEqual(correctOptionIds(fiveOptions, ["5"]), ["1730000000000"]);
});

test("the four starter options still map to themselves", () => {
  for (const position of ["1", "2", "3", "4"]) {
    assert.deepEqual(correctOptionIds(starterOptions, [position]), [position]);
  }
});

test("positions after a deleted option point at the option now shown there", () => {
  // Option 2 was deleted, so the editor shows ids 1, 3, 4 as Options 1-3.
  const options = [{ id: "1" }, { id: "3" }, { id: "4" }];
  assert.deepEqual(correctOptionIds(options, ["2"]), ["3"]);
  assert.deepEqual(correctOptionIds(options, ["3"]), ["4"]);
});

test("multi-answer positions map in order", () => {
  assert.deepEqual(correctOptionIds(fiveOptions, ["2", "5"]), [
    "2",
    "1730000000000",
  ]);
});

test("blank, malformed, zero, and out-of-range answers name no option", () => {
  assert.deepEqual(correctOptionIds(starterOptions, [""]), []);
  assert.deepEqual(correctOptionIds(starterOptions, ["0"]), []);
  assert.deepEqual(correctOptionIds(starterOptions, ["5"]), []);
  assert.deepEqual(correctOptionIds(starterOptions, ["a"]), []);
  assert.deepEqual(correctOptionIds(starterOptions, ["-1"]), []);
  assert.deepEqual(correctOptionIds(starterOptions, ["1.5"]), []);
  assert.deepEqual(correctOptionIds([], ["1"]), []);
});

test("whitespace around a position is ignored and repeats count once", () => {
  assert.deepEqual(correctOptionIds(starterOptions, [" 3 "]), ["3"]);
  assert.deepEqual(correctOptionIds(starterOptions, ["2", "2"]), ["2"]);
});

test("deleting an option keeps the answers on the same options", () => {
  // Answers were Options 1, 3 and 5; Option 2 is deleted.
  const answers = answersAfterOptionRemoved(["1", "3", "5"], 1);
  assert.deepEqual(answers, ["1", "2", "4"]);

  const before = correctOptionIds(fiveOptions, ["1", "3", "5"]);
  const after = correctOptionIds(
    fiveOptions.filter((_, index) => index !== 1),
    answers,
  );
  assert.deepEqual(after, before);
});

test("deleting a correct option drops it from the answers", () => {
  assert.deepEqual(answersAfterOptionRemoved(["5"], 4), []);
  assert.deepEqual(answersAfterOptionRemoved(["2", "4"], 1), ["3"]);
});

test("deleting an option leaves entries that aren't positions alone", () => {
  assert.deepEqual(answersAfterOptionRemoved([""], 0), [""]);
  assert.deepEqual(answersAfterOptionRemoved(["x", "3"], 0), ["x", "2"]);
});

test("the editor flags answers that name no option", () => {
  assert.deepEqual(missingOptionPositions(["5"], 4), [5]);
  assert.deepEqual(missingOptionPositions(["5"], 5), []);
  assert.deepEqual(missingOptionPositions(["0"], 4), [0]);
  assert.deepEqual(missingOptionPositions(["1", "6", "7"], 5), [6, 7]);
  // A blank or half-typed answer is the format check's job, not this one's.
  assert.deepEqual(missingOptionPositions([""], 4), []);
  assert.deepEqual(missingOptionPositions(["1", ""], 4), []);
});
