import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_HEADING_LEVEL,
  HEADING_LEVELS,
  nearestHeadingLevel,
} from "../src/components/article-creator/headingLevels.ts";

test("a new heading is a Heading 1, one of the levels authors can choose", () => {
  assert.equal(DEFAULT_HEADING_LEVEL, 1);
  assert.ok(HEADING_LEVELS.includes(DEFAULT_HEADING_LEVEL));
});

test("Heading 2 and 3 can still be chosen", () => {
  assert.deepEqual([...HEADING_LEVELS], [1, 2, 3]);
});

test("a saved level the editor offers is kept as it is", () => {
  for (const level of HEADING_LEVELS) {
    assert.equal(nearestHeadingLevel(level, HEADING_LEVELS), level);
  }
});

test("a saved H4 to H6 becomes H3, not the Heading 1 default", () => {
  assert.equal(nearestHeadingLevel(4, HEADING_LEVELS), 3);
  assert.equal(nearestHeadingLevel(5, HEADING_LEVELS), 3);
  assert.equal(nearestHeadingLevel(6, HEADING_LEVELS), 3);
});

test("a level below 1 becomes Heading 1", () => {
  assert.equal(nearestHeadingLevel(0, HEADING_LEVELS), 1);
  assert.equal(nearestHeadingLevel(-2, HEADING_LEVELS), 1);
});

test("ties go to the bigger heading, as the Heading tool does for paste", () => {
  assert.equal(nearestHeadingLevel(2, [1, 3]), 1);
  assert.equal(nearestHeadingLevel(5, [2, 4, 6]), 4);
});

test("with no levels to choose from, the level is left alone", () => {
  assert.equal(nearestHeadingLevel(4, []), 4);
});
