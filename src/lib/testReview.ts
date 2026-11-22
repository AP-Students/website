import { correctOptionIds } from "./questionAnswers.ts";

// Grading a unit test attempt, and lining it up with the test again later
// for the review page. The server grades and saves attempts with this and the
// review page reads them back with it, so both agree on what was right.
//
// Test questions come from Firestore, so everything here reads them
// defensively instead of trusting the QuestionFormat type.

/**
 * Where a student's attempt at a test is filed (users/{uid}/testAttempts/…).
 * The same shape as the completion receipt's key, so subject and unit are
 * part of it and two tests can't collide.
 */
export const testAttemptKey = (test: {
  subject: string;
  unitId: string;
  testId: string;
}) =>
  encodeURIComponent(JSON.stringify([test.subject, test.unitId, test.testId]));

/** Selected option ids, by question index. */
export type AttemptAnswers = Record<number, string[]>;

interface QuestionLike {
  type?: unknown;
  options?: unknown;
  answers?: unknown;
  question?: unknown;
}

const strings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];

const optionIds = (question: QuestionLike): { id: string }[] =>
  (Array.isArray(question.options) ? question.options : []).map(
    (option: unknown) => ({
      id:
        typeof option === "object" && option !== null && "id" in option
          ? String((option as { id: unknown }).id)
          : "",
    }),
  );

/** The ids of a question's correct options (stored answers are positions). */
export const correctIdsFor = (question: QuestionLike): string[] =>
  correctOptionIds(optionIds(question), strings(question.answers));

/** Multiple choice and multi-answer questions with a usable answer key. */
export const isGradable = (question: QuestionLike): boolean =>
  (question.type === "mcq" || question.type === "multi-answer") &&
  correctIdsFor(question).length > 0;

/** Right only if exactly the correct options were picked. */
export function isAnswerCorrect(
  question: QuestionLike,
  chosen: readonly string[],
): boolean {
  const correct = correctIdsFor(question);
  const picked = new Set(chosen);
  return (
    correct.length > 0 &&
    picked.size === chosen.length &&
    picked.size === correct.length &&
    correct.every((id) => picked.has(id))
  );
}

export function gradeAttempt(
  questions: readonly QuestionLike[],
  answers: AttemptAnswers,
): { gradable: boolean; correct: boolean }[] {
  return questions.map((question, index) => {
    const gradable = isGradable(question);
    return {
      gradable,
      correct: gradable && isAnswerCorrect(question, answers[index] ?? []),
    };
  });
}

// A short fingerprint of what a student saw and what counted as right. Saved
// with the attempt so the review page can tell if a question was edited
// since, rather than showing an answer against a different question.
export function questionFingerprint(question: QuestionLike): string {
  const text = (value: unknown) =>
    typeof value === "object" && value !== null && "value" in value
      ? String((value as { value: unknown }).value)
      : "";
  const options = Array.isArray(question.options) ? question.options : [];
  const key = JSON.stringify([
    question.type,
    text(question.question),
    options.map((option: unknown) => [
      typeof option === "object" && option !== null && "id" in option
        ? String((option as { id: unknown }).id)
        : "",
      typeof option === "object" && option !== null && "value" in option
        ? text((option as { value: unknown }).value)
        : "",
    ]),
    strings(question.answers),
  ]);
  // FNV-1a: tiny and stable, which is all this needs. It isn't security.
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export interface ReviewItem {
  index: number;
  gradable: boolean;
  /** What the student picked, or [] if they skipped it. */
  chosen: string[];
  correctIds: string[];
  correct: boolean;
  /** The question was edited after the attempt, so `chosen` may not fit it. */
  changed: boolean;
}

/** The current test, question by question, with the saved attempt on top. */
export function reviewAttempt(
  questions: readonly QuestionLike[],
  attempt: { answers?: unknown; fingerprints?: unknown },
): ReviewItem[] {
  const saved =
    typeof attempt.answers === "object" && attempt.answers !== null
      ? (attempt.answers as Record<string, unknown>)
      : {};
  const fingerprints = strings(attempt.fingerprints);
  return questions.map((question, index) => {
    const changed = fingerprints[index] !== questionFingerprint(question);
    const chosen = changed ? [] : strings(saved[String(index)]);
    const gradable = isGradable(question);
    return {
      index,
      gradable,
      chosen,
      correctIds: correctIdsFor(question),
      correct: gradable && !changed && isAnswerCorrect(question, chosen),
      changed,
    };
  });
}
