import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeUsername, usernameProblem } from "../src/lib/username.ts";

test("usernames are trimmed, lowercased and lose a leading @", () => {
  assert.equal(normalizeUsername("  @Sam_Lee "), "sam_lee");
});

test("good usernames pass", () => {
  for (const name of ["sam", "sam_lee", "a1b2c3", "x".repeat(20)]) {
    assert.equal(usernameProblem(name), null, name);
  }
});

test("bad usernames say what's wrong", () => {
  assert.match(usernameProblem("ab")!, /at least 3/);
  assert.match(usernameProblem("x".repeat(21))!, /at most 20/);
  assert.match(usernameProblem("sam lee")!, /letters, numbers and underscores/);
  assert.match(usernameProblem("sam.lee")!, /letters, numbers and underscores/);
  assert.match(usernameProblem("sámlee")!, /letters, numbers and underscores/);
  assert.match(usernameProblem("1sam")!, /Start your username with a letter/);
  assert.match(usernameProblem("_sam")!, /Start your username with a letter/);
  assert.match(usernameProblem("admin")!, /isn't available/);
});
