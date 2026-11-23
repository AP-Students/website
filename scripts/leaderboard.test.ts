import assert from "node:assert/strict";
import { test } from "node:test";
import {
  friendsBoard,
  rankEntries,
  rankFromCountAbove,
  toLeaderboardEntry,
} from "../src/lib/leaderboard.ts";
import { levelForXp } from "../src/lib/gamification/xp.ts";

const entry = (uid: string, xp: number) => ({
  uid,
  displayName: uid,
  level: 1,
  xp,
});

test("ranks go down the list by XP", () => {
  const ranked = rankEntries([
    entry("a", 300),
    entry("b", 200),
    entry("c", 100),
  ]);
  assert.deepEqual(
    ranked.map((row) => row.rank),
    [1, 2, 3],
  );
});

test("people with the same XP share a rank, and the next rank skips", () => {
  const ranked = rankEntries([
    entry("a", 300),
    entry("b", 200),
    entry("c", 200),
    entry("d", 100),
  ]);
  assert.deepEqual(
    ranked.map((row) => row.rank),
    [1, 2, 2, 4],
  );
});

test("your rank is one more than the number of people above you", () => {
  assert.equal(rankFromCountAbove(0), 1);
  assert.equal(rankFromCountAbove(41), 42);
  // Matches rankEntries for a tie: two people at 200 are both behind one at 300.
  assert.equal(rankFromCountAbove(1), 2);
  assert.equal(rankFromCountAbove(Number.NaN), 1);
});

test("a profile doc becomes a row with its level worked out from XP", () => {
  const row = toLeaderboardEntry("u1", {
    displayName: "  Sam  ",
    photoURL: "https://lh3.googleusercontent.com/a/photo",
    xp: 1234,
    level: 99,
    email: "never shown",
  });
  assert.deepEqual(row, {
    uid: "u1",
    displayName: "Sam",
    photoURL: "https://lh3.googleusercontent.com/a/photo",
    level: levelForXp(1234).level,
    xp: 1234,
  });
});

test("missing or bad fields fall back to safe values", () => {
  assert.deepEqual(toLeaderboardEntry("u2", undefined), {
    uid: "u2",
    displayName: "Student",
    level: levelForXp(0).level,
    xp: 0,
  });
  const row = toLeaderboardEntry("u3", {
    displayName: 5,
    photoURL: "javascript:alert(1)",
    xp: -40,
  });
  assert.equal(row.displayName, "Student");
  assert.equal(row.photoURL, undefined);
  assert.equal(row.xp, 0);
});

test("the friends board ranks you among your friends, highest XP first", () => {
  const board = friendsBoard(entry("me", 200), [
    entry("ann", 500),
    entry("bo", 100),
    entry("cy", 200),
  ]);
  assert.deepEqual(
    board.map((row) => `${row.rank}:${row.uid}`),
    ["1:ann", "2:cy", "2:me", "4:bo"],
  );
});

test("the friends board never lists you twice", () => {
  const board = friendsBoard(entry("me", 50), [entry("me", 50)]);
  assert.equal(board.length, 1);
});
