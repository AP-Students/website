import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_INTENSITY_THRESHOLDS,
  buildCalendarWeeks,
  buildYearCalendar,
  cappedThresholds,
  countByDay,
  dayLabel,
  daySummary,
  intensityLevel,
  thresholdsForMax,
  weeksInYear,
} from "../src/lib/gamification/activityCalendar.ts";
import { dayOfWeek, daysBetween } from "../src/lib/gamification/calendarDay.ts";

test("intensity levels follow the default thresholds", () => {
  assert.equal(intensityLevel(0), 0);
  assert.equal(intensityLevel(1), 1);
  assert.equal(intensityLevel(2), 1);
  assert.equal(intensityLevel(3), 2);
  assert.equal(intensityLevel(6), 3);
  assert.equal(intensityLevel(10), 4);
  assert.equal(intensityLevel(250), 4);
});

test("intensity thresholds are configurable", () => {
  assert.equal(intensityLevel(2, [1, 2, 3, 4]), 2);
  assert.equal(intensityLevel(4, [1, 2, 3, 4]), 4);
});

test("[1,5] -> 6: a new busiest day takes the top level and earlier days shift down", () => {
  const before = thresholdsForMax(5);
  assert.equal(intensityLevel(1, before), 1);
  assert.equal(intensityLevel(5, before), 4);

  const after = thresholdsForMax(6);
  assert.equal(intensityLevel(6, after), 4);
  assert.equal(intensityLevel(5, after), 3);
  assert.equal(intensityLevel(1, after), 1);
});

test("relative intensity: a day with no activity is level 0 whatever the max", () => {
  assert.equal(intensityLevel(0, thresholdsForMax(0)), 0);
  assert.equal(intensityLevel(0, thresholdsForMax(1)), 0);
  assert.equal(intensityLevel(0, thresholdsForMax(40)), 0);
});

test("relative intensity: any activity shows, and the busiest day is level 4", () => {
  for (let max = 1; max <= 60; max++) {
    const thresholds = thresholdsForMax(max);
    assert.ok(intensityLevel(1, thresholds) >= 1, `1 hidden at max ${max}`);
    assert.equal(intensityLevel(max, thresholds), 4, `max ${max}`);
    for (let count = 1; count < max; count++) {
      assert.ok(
        intensityLevel(count, thresholds) <=
          intensityLevel(count + 1, thresholds),
        `level fell from ${count} to ${count + 1} at max ${max}`,
      );
    }
  }
});

test("countByDay buckets by the student's day, not UTC's", () => {
  const counts = countByDay(
    [
      new Date("2026-09-22T15:00:00Z"),
      new Date("2026-09-23T03:30:00Z"), // still the 22nd in Los Angeles
      new Date("2026-09-23T18:00:00Z"),
    ],
    "America/Los_Angeles",
  );
  assert.deepEqual(
    [...counts],
    [
      ["2026-09-22", 2],
      ["2026-09-23", 1],
    ],
  );
});

test("weeks start on Sunday and the last week stops at lastDay", () => {
  // 2026-09-26 is a Saturday, 2026-09-23 a Wednesday.
  const counts = new Map([["2026-09-21", 3]]);
  const weeks = buildCalendarWeeks(counts, { lastDay: "2026-09-23", weeks: 2 });

  assert.equal(weeks.length, 2);
  assert.equal(weeks[0]![0]!.day, "2026-09-13");
  assert.equal(weeks[1]![0]!.day, "2026-09-20");
  assert.deepEqual(weeks[1]![1], { day: "2026-09-21", count: 3, level: 2 });
  assert.equal(weeks[1]![3]!.day, "2026-09-23");
  assert.deepEqual(weeks[1]!.slice(4), [null, null, null]);
});

test("weeks can start on Monday", () => {
  const weeks = buildCalendarWeeks(new Map(), {
    lastDay: "2026-09-26",
    weeks: 1,
    weekStartsOn: 1,
  });
  assert.equal(weeks[0]![0]!.day, "2026-09-21");
  assert.equal(weeks[0]![5]!.day, "2026-09-26");
  assert.equal(weeks[0]![6], null);
});

test("a full year is 53 unbroken columns ending today", () => {
  const weeks = buildCalendarWeeks(new Map(), { lastDay: "2026-09-26" });
  const days = weeks.flat().filter((cell) => cell !== null);
  assert.equal(weeks.length, 53);
  assert.equal(days.at(-1)!.day, "2026-09-26");
  assert.equal(days.length, 53 * 7);
});

const isLeap = (year: number) =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

test("most years span 53 week columns, but 2028 spans 54", () => {
  assert.equal(weeksInYear(2026), 53);
  assert.equal(weeksInYear(2027), 53);
  assert.equal(weeksInYear(2028), 54);
});

test("only a leap year starting on the week's last day needs 54 columns", () => {
  for (let year = 1900; year <= 2100; year++) {
    const jan1 = dayOfWeek(`${year}-01-01`);
    assert.equal(weeksInYear(year, 0), isLeap(year) && jan1 === 6 ? 54 : 53);
    assert.equal(weeksInYear(year, 1), isLeap(year) && jan1 === 0 ? 54 : 53);
  }
});

test("2028's first and last days each sit alone in their column", () => {
  const { weeks } = buildYearCalendar(new Map(), 2028, { today: "2028-12-31" });
  assert.equal(weeks.length, 54);
  // Jan 1, 2028 is a Saturday: the bottom of the first column.
  assert.deepEqual(
    weeks[0]!.map((cell) => cell?.day ?? null),
    [null, null, null, null, null, null, "2028-01-01"],
  );
  // Dec 31, 2028 is a Sunday: the top of the last column.
  assert.deepEqual(
    weeks[53]!.map((cell) => cell?.day ?? null),
    ["2028-12-31", null, null, null, null, null, null],
  );
});

test("the year calendar holds every day of the year exactly once, in order", () => {
  const { weeks } = buildYearCalendar(new Map(), 2026, { today: "2026-10-04" });
  const days = weeks.flat().flatMap((cell) => (cell ? [cell.day] : []));
  assert.equal(days.length, 365);
  assert.equal(days[0], "2026-01-01");
  assert.equal(days[364], "2026-12-31");
  // Column-major order is day order: each day is the one after the last.
  days
    .slice(1)
    .forEach((day, i) => assert.equal(daysBetween(days[i]!, day), 1));
});

test("days after today are drawn empty and can't be selected", () => {
  const counts = new Map([
    ["2026-10-04", 2],
    ["2026-10-05", 9],
  ]);
  const calendar = buildYearCalendar(counts, 2026, { today: "2026-10-04" });
  const cells = new Map(
    calendar.weeks.flat().flatMap((cell) => (cell ? [[cell.day, cell]] : [])),
  );

  assert.equal(calendar.lastDay, "2026-10-04");
  assert.equal(cells.get("2026-10-04")?.isFuture, false);
  assert.deepEqual(cells.get("2026-10-05"), {
    day: "2026-10-05",
    count: 0,
    level: 0,
    isFuture: true,
  });
  assert.equal(calendar.total, 2);
});

test("a past year ends on Dec 31 and a future one has nothing to select", () => {
  const today = "2026-10-04";
  assert.equal(
    buildYearCalendar(new Map(), 2025, { today }).lastDay,
    "2025-12-31",
  );
  const next = buildYearCalendar(new Map(), 2027, { today });
  assert.equal(next.lastDay, null);
  assert.ok(next.weeks.flat().every((cell) => cell === null || cell.isFuture));
});

test("the total and the shades count only the year being shown", () => {
  const counts = new Map([
    ["2025-12-31", 50],
    ["2026-01-01", 3],
    ["2026-06-15", 4],
  ]);
  const calendar = buildYearCalendar(counts, 2026, { today: "2026-10-04" });
  assert.equal(calendar.total, 7);
  // Last year's 50 doesn't set this year's scale: 4 is this year's busiest.
  const june15 = calendar.weeks
    .flat()
    .find((cell) => cell?.day === "2026-06-15");
  assert.equal(june15?.level, 4);
});

test("one huge day doesn't make the rest of the year look empty", () => {
  // Twenty days of 1 to 4 activities, and one day of 40.
  const counts = Array.from({ length: 20 }, (_, i) => (i % 4) + 1);
  const capped = cappedThresholds([...counts, 40]);
  assert.equal(intensityLevel(4, capped), 4);
  assert.equal(intensityLevel(40, capped), 4);
  assert.equal(intensityLevel(1, capped), 1);

  // Scaled to the busiest day, a 4-activity day would be the lightest shade.
  assert.equal(intensityLevel(4, thresholdsForMax(40)), 1);
});

test("the cap is the 90th percentile of active days, not counting empty ones", () => {
  // Ten active days, 1 through 10: the 9th (nearest rank) is 9.
  const capped = cappedThresholds([0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(capped, thresholdsForMax(9));
  assert.equal(intensityLevel(9, capped), 4);
  assert.equal(intensityLevel(8, capped), 3);
});

test("with no activity at all the default thresholds apply", () => {
  assert.deepEqual(cappedThresholds([]), DEFAULT_INTENSITY_THRESHOLDS);
  assert.deepEqual(cappedThresholds([0, 0]), DEFAULT_INTENSITY_THRESHOLDS);
});

test("each month labels the columns that start in it, all twelve in order", () => {
  for (const year of [2026, 2027, 2028]) {
    const { weeks, months } = buildYearCalendar(new Map(), year, {
      today: `${year}-12-31`,
    });
    assert.deepEqual(
      months.map((span) => span.month),
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    );
    assert.equal(
      months.reduce((sum, span) => sum + span.weeks, 0),
      weeks.length,
    );
    // Wide enough for a three-letter label.
    assert.ok(months.every((span) => span.weeks >= 4));
  }
  // Sep 27 - Oct 3, 2026 is September's column; October starts with Oct 4.
  const { weeks, months } = buildYearCalendar(new Map(), 2026, {
    today: "2026-12-31",
  });
  const october = months.find((span) => span.month === 9)!;
  assert.equal(weeks[october.firstWeek]![0]?.day, "2026-10-04");
});

test("a day's summary reads like the tooltip in the spec", () => {
  assert.equal(daySummary("2026-09-20", 3), "3 activities on Sep 20.");
  assert.equal(daySummary("2026-09-20", 1), "1 activity on Sep 20.");
  assert.equal(daySummary("2026-09-20", 0), "No activity on Sep 20.");
});

test("a day's screen reader label names the weekday and year", () => {
  assert.equal(
    dayLabel("2026-09-20", 3),
    "3 activities on Sunday, September 20, 2026",
  );
});
