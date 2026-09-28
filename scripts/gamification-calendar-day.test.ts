import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addDays,
  dayOfWeek,
  daysBetween,
  eachDay,
  resolveTimeZone,
  toDayKey,
} from "../src/lib/gamification/calendarDay.ts";

test("the same instant is a different day in different zones", () => {
  // 03:30 UTC on Wednesday is still Tuesday evening across the Americas.
  const instant = new Date("2026-09-23T03:30:00Z");
  assert.equal(toDayKey(instant, "UTC"), "2026-09-23");
  assert.equal(toDayKey(instant, "America/Los_Angeles"), "2026-09-22");
  assert.equal(toDayKey(instant, "America/New_York"), "2026-09-22");
  assert.equal(toDayKey(instant, "Asia/Tokyo"), "2026-09-23");
});

test("half-hour offsets split days at their own midnight", () => {
  // India is UTC+5:30, so 18:29 UTC is 23:59 there and 18:30 UTC is midnight.
  assert.equal(
    toDayKey(new Date("2026-09-22T18:29:00Z"), "Asia/Kolkata"),
    "2026-09-22",
  );
  assert.equal(
    toDayKey(new Date("2026-09-22T18:30:00Z"), "Asia/Kolkata"),
    "2026-09-23",
  );
});

test("the 23-hour spring-forward day keeps its own midnight", () => {
  // New York springs forward on 2026-03-08: midnight that day is 05:00 UTC
  // (EST), but midnight the next day is 04:00 UTC (EDT).
  const zone = "America/New_York";
  assert.equal(toDayKey(new Date("2026-03-08T04:59:00Z"), zone), "2026-03-07");
  assert.equal(toDayKey(new Date("2026-03-08T05:00:00Z"), zone), "2026-03-08");
  assert.equal(toDayKey(new Date("2026-03-09T03:59:00Z"), zone), "2026-03-08");
  assert.equal(toDayKey(new Date("2026-03-09T04:00:00Z"), zone), "2026-03-09");
});

test("the 25-hour fall-back day keeps its own midnight", () => {
  // New York falls back on 2026-11-01: midnight is 04:00 UTC (EDT) and the
  // next midnight is 05:00 UTC (EST), so 04:30 UTC on the 2nd is still the 1st.
  const zone = "America/New_York";
  assert.equal(toDayKey(new Date("2026-11-01T03:59:00Z"), zone), "2026-10-31");
  assert.equal(toDayKey(new Date("2026-11-01T04:00:00Z"), zone), "2026-11-01");
  assert.equal(toDayKey(new Date("2026-11-02T04:30:00Z"), zone), "2026-11-01");
  assert.equal(toDayKey(new Date("2026-11-02T05:00:00Z"), zone), "2026-11-02");
});

test("adding 24 hours would skip or repeat a day around DST; addDays does not", () => {
  const zone = "America/New_York";
  // The 8th is only 23 hours long, so 23:30 on the 7th plus 24 hours is
  // 00:30 on the 9th: "the next day" skipped the 8th entirely. Stepping on
  // the calendar cannot skip.
  const lateOnSeventh = new Date("2026-03-08T04:30:00Z"); // 23:30 EST on the 7th
  const plus24h = new Date(lateOnSeventh.getTime() + 24 * 60 * 60 * 1000);
  assert.equal(toDayKey(plus24h, zone), "2026-03-09");
  assert.equal(addDays(toDayKey(lateOnSeventh, zone), 1), "2026-03-08");
});

test("addDays crosses months, years, and leap days", () => {
  assert.equal(addDays("2026-01-31", 1), "2026-02-01");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2028-02-28", 1), "2028-02-29");
  assert.equal(addDays("2027-02-28", 1), "2027-03-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
});

test("daysBetween counts whole calendar days across DST changes", () => {
  assert.equal(daysBetween("2026-03-07", "2026-03-09"), 2);
  assert.equal(daysBetween("2026-10-31", "2026-11-02"), 2);
  assert.equal(daysBetween("2026-01-01", "2027-01-01"), 365);
  assert.equal(daysBetween("2026-09-26", "2026-09-20"), -6);
});

test("dayOfWeek and eachDay", () => {
  assert.equal(dayOfWeek("2026-09-26"), 6); // Saturday
  assert.equal(dayOfWeek("2026-09-27"), 0); // Sunday
  assert.deepEqual(eachDay("2026-02-27", "2026-03-02"), [
    "2026-02-27",
    "2026-02-28",
    "2026-03-01",
    "2026-03-02",
  ]);
  assert.deepEqual(eachDay("2026-03-02", "2026-03-01"), []);
});

test("unknown zones fall back to UTC instead of throwing", () => {
  assert.equal(resolveTimeZone("Mars/Olympus_Mons"), "UTC");
  assert.equal(resolveTimeZone(undefined), "UTC");
  assert.equal(resolveTimeZone("Europe/London"), "Europe/London");
  assert.equal(
    toDayKey(new Date("2026-09-22T23:30:00Z"), "not-a-zone"),
    "2026-09-22",
  );
});

test("malformed or impossible day keys are rejected", () => {
  assert.throws(() => addDays("2026-02-30", 1), RangeError);
  assert.throws(() => addDays("26-9-1", 1), RangeError);
  assert.throws(() => toDayKey(new Date("nope"), "UTC"), RangeError);
});
