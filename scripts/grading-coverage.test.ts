import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canGrade,
  coverageBySubject,
  coveredSubjects,
  gradersOf,
  subjectChoices,
  subjectsFor,
  type TeamMember,
} from "../src/lib/gradingCoverage.ts";

const SUBJECTS = [
  "AP Biology",
  "AP Calculus AB",
  "AP Chemistry",
  "AP Physics 1",
];

const member = (
  uid: string,
  access: string,
  graderSubjectAccess?: unknown,
): TeamMember => ({ uid, displayName: uid, access, graderSubjectAccess });

test("graders, members and admins can grade; users and banned accounts can't", () => {
  assert.equal(canGrade("grader"), true);
  assert.equal(canGrade("member"), true);
  assert.equal(canGrade("admin"), true);
  assert.equal(canGrade("user"), false);
  assert.equal(canGrade("banned"), false);
  assert.equal(canGrade(undefined), false);
});

test("a subject with one grader is covered, one with none isn't", () => {
  const team = [member("ana", "grader", ["AP Biology"])];
  assert.deepEqual(coveredSubjects(SUBJECTS, team), ["AP Biology"]);
});

test("a subject with several graders lists all of them", () => {
  const team = [
    member("cy", "grader", ["AP Chemistry"]),
    member("ana", "member", ["AP Chemistry", "AP Biology"]),
    member("bo", "admin", ["AP Chemistry"]),
  ];
  const coverage = coverageBySubject(SUBJECTS, team);
  assert.deepEqual(
    coverage.get("AP Chemistry")?.map((m) => m.uid),
    ["ana", "bo", "cy"],
  );
  assert.deepEqual(coverage.get("AP Physics 1"), []);
  assert.deepEqual(coveredSubjects(SUBJECTS, team), [
    "AP Biology",
    "AP Chemistry",
  ]);
});

test("removing the last grader for a subject uncovers it", () => {
  const before = [
    member("ana", "grader", ["AP Biology", "AP Chemistry"]),
    member("bo", "grader", ["AP Biology"]),
  ];
  // Ana drops Chemistry: Biology still has Bo, Chemistry has nobody.
  const after = [member("ana", "grader", ["AP Biology"]), before[1]!];
  assert.deepEqual(coveredSubjects(SUBJECTS, before), [
    "AP Biology",
    "AP Chemistry",
  ]);
  assert.deepEqual(coveredSubjects(SUBJECTS, after), ["AP Biology"]);
});

test("adding the first grader for a subject covers it", () => {
  const team = [member("ana", "grader", [])];
  assert.deepEqual(coveredSubjects(SUBJECTS, team), []);
  team[0] = member("ana", "grader", ["AP Physics 1"]);
  assert.deepEqual(coveredSubjects(SUBJECTS, team), ["AP Physics 1"]);
});

test("a new team member with no subjects covers nothing", () => {
  const team = [
    member("new", "grader"),
    member("ana", "grader", ["AP Biology"]),
  ];
  assert.deepEqual(coveredSubjects(SUBJECTS, team), ["AP Biology"]);
  assert.deepEqual(subjectsFor(team[0]!), []);
});

test("subjects only count while someone can grade", () => {
  const team = [
    member("demoted", "user", ["AP Biology"]),
    member("banned", "banned", ["AP Chemistry"]),
  ];
  assert.deepEqual(coveredSubjects(SUBJECTS, team), []);
  assert.deepEqual(gradersOf(team), []);
  // Promoted again, their saved subjects count again.
  team[0] = member("demoted", "grader", ["AP Biology"]);
  assert.deepEqual(coveredSubjects(SUBJECTS, team), ["AP Biology"]);
});

test("bad values in a user doc are ignored instead of breaking things", () => {
  assert.deepEqual(subjectsFor(member("a", "grader", "AP Biology")), []);
  assert.deepEqual(subjectsFor(member("a", "grader", null)), []);
  assert.deepEqual(
    subjectsFor(member("a", "grader", ["AP Biology", 3, null, "AP Biology"])),
    ["AP Biology"],
  );
  // A subject that's been renamed doesn't count as covering anything.
  assert.deepEqual(
    coveredSubjects(SUBJECTS, [member("a", "grader", ["AP Bio"])]),
    [],
  );
});

test("graders are listed by name", () => {
  const team = [
    { uid: "1", displayName: "zed", access: "grader" },
    { uid: "2", displayName: "Amy", access: "admin" },
    { uid: "3", access: "member" },
    { uid: "4", displayName: "bob", access: "user" },
  ];
  assert.deepEqual(
    gradersOf(team).map((m) => m.uid),
    ["3", "2", "1"],
  );
});

test("students see every subject until filtering is turned on", () => {
  assert.deepEqual(subjectChoices(SUBJECTS, undefined), {
    subjects: SUBJECTS,
    limited: false,
  });
});

test("once it's on, students only see covered subjects, in the usual order", () => {
  assert.deepEqual(
    subjectChoices(SUBJECTS, {
      subjects: ["AP Physics 1", "AP Biology"],
    }),
    { subjects: ["AP Biology", "AP Physics 1"], limited: true },
  );
});

test("if nobody can grade anything, students see no subjects", () => {
  assert.deepEqual(subjectChoices(SUBJECTS, { subjects: [] }), {
    subjects: [],
    limited: true,
  });
});

test("a broken coverage doc shows every subject rather than hiding them", () => {
  for (const data of [{}, { subjects: "AP Biology" }, { subjects: null }]) {
    assert.deepEqual(subjectChoices(SUBJECTS, data), {
      subjects: SUBJECTS,
      limited: false,
    });
  }
  // Names that aren't subjects are just skipped.
  assert.deepEqual(
    subjectChoices(SUBJECTS, { subjects: ["AP Biology", "Nope", 4] }),
    { subjects: ["AP Biology"], limited: true },
  );
});
