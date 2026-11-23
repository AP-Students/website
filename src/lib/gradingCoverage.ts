// Which AP subjects the team can grade FRQs for.
//
// Each staff member's user doc lists the subjects they can grade in
// graderSubjectAccess, set by an admin. Students can't read other people's
// user docs, so the admin page also saves the combined list to
// gradingCoverage/frq, which anyone can read, and the FRQ submission page
// only offers those subjects.

// The roles that can open the grading queue.
export const GRADING_ROLES = ["admin", "member", "grader"] as const;

export const COVERAGE_COLLECTION = "gradingCoverage";
export const COVERAGE_DOC_ID = "frq";

export interface TeamMember {
  uid: string;
  displayName?: string;
  access?: string;
  graderSubjectAccess?: unknown;
}

export function canGrade(access: unknown): boolean {
  return (GRADING_ROLES as readonly unknown[]).includes(access);
}

// The subjects someone has been marked as able to grade. Ignores anything
// that isn't a list of strings, so a bad value in Firestore can't break the
// page.
export function subjectsFor(member: TeamMember): string[] {
  const value = member.graderSubjectAccess;
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((s): s is string => typeof s === "string"))];
}

// Every staff member who can grade, sorted by name.
export function gradersOf<T extends TeamMember>(members: readonly T[]): T[] {
  return members
    .filter((member) => canGrade(member.access))
    .sort((a, b) =>
      (a.displayName ?? "").localeCompare(b.displayName ?? "", undefined, {
        sensitivity: "base",
      }),
    );
}

// For each subject, who can grade it. Only counts people who can actually
// grade right now: a user or banned account keeps its subjects saved (so
// they come back if the role does) but doesn't count.
export function coverageBySubject<T extends TeamMember>(
  subjects: readonly string[],
  members: readonly T[],
): Map<string, T[]> {
  const graders = gradersOf(members);
  return new Map(
    subjects.map((subject) => [
      subject,
      graders.filter((grader) => subjectsFor(grader).includes(subject)),
    ]),
  );
}

// The subjects at least one grader can grade, in the order given.
export function coveredSubjects(
  subjects: readonly string[],
  members: readonly TeamMember[],
): string[] {
  return [...coverageBySubject(subjects, members)]
    .filter(([, graders]) => graders.length > 0)
    .map(([subject]) => subject);
}

export interface SubjectChoices {
  subjects: string[];
  // False until an admin has set up qualifications. Until then every subject
  // is offered, so turning this on doesn't hide anything by surprise.
  limited: boolean;
}

// What the submission page should offer, given the gradingCoverage/frq doc
// (undefined if it doesn't exist). If the doc is missing or doesn't look
// right, everything is offered: better to take an FRQ we're slow to grade
// than to hide a subject because of bad data.
export function subjectChoices(
  allSubjects: readonly string[],
  coverage: Record<string, unknown> | undefined,
): SubjectChoices {
  const saved = coverage?.subjects;
  if (!Array.isArray(saved)) {
    return { subjects: [...allSubjects], limited: false };
  }
  const covered = new Set(saved);
  return {
    subjects: allSubjects.filter((subject) => covered.has(subject)),
    limited: true,
  };
}
