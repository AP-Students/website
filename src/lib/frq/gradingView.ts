import type {
  FRQQuestionGrade,
  FRQTemplate,
  FRQTemplatePart,
} from "@/types/frq";
import type { QuestionFile } from "@/types/questions";
import { getPartLabel } from "./template.ts";

/**
 * The model the grading page pages through, kept apart from the component so
 * the tallies can be tested without mounting React or touching Firestore.
 *
 * Deliberately not `buildStudentQuestions`: that drops parts marked `legacy`,
 * and a grader has to see them. A submission written while a part was still
 * public keeps its response under that part's id forever, so hiding the part
 * would strand the response unread and quietly shrink the denominator the
 * score is reported against.
 */

/** A part as the grader sees it, carrying the letter printed beside it. */
export interface GradingPart {
  part: FRQTemplatePart;
  /** "A", "B", ... Restarts at A inside every question, as AP prints them. */
  label: string;
}

/** One question the grader can navigate to, with every part hanging off it. */
export interface GradingQuestion {
  id: string;
  /**
   * Stimulus for this question alone. The template's exam-wide `directions`
   * stays separate and is shown alongside, never merged into this.
   */
  stimulus?: string;
  stimulusFiles?: QuestionFile[];
  parts: GradingPart[];
}

/** Points awarded per criterion, plus the grader's note, for one part. */
export interface PartGrade {
  feedback: string;
  criteria: Record<string, number>;
}

/**
 * Group every part in the template under its question, in reading order.
 *
 * A question with no parts is dropped. Nothing can be scored on it and no
 * stored response can key to it, so keeping it would only give the footer an
 * empty page to walk into.
 */
export const buildGradingQuestions = (
  template: FRQTemplate,
): GradingQuestion[] =>
  template.questions
    .filter((question) => question.parts.length > 0)
    .map((question) => ({
      id: question.id,
      stimulus: question.stimulus,
      stimulusFiles: question.stimulusFiles,
      parts: question.parts.map((part, index) => ({
        part,
        // Labels are positional within the question, never within the exam, so
        // question 2 starts at A again rather than continuing from question 1.
        label: getPartLabel(index),
      })),
    }));

/** Every part on the grading pages, flattened back into reading order. */
export const getGradingParts = (
  questions: GradingQuestion[],
): FRQTemplatePart[] =>
  questions.flatMap((question) => question.parts.map(({ part }) => part));

/**
 * Which question page a part sits on, or -1 when the template no longer
 * defines it. Unlike the student view this does resolve legacy parts, because
 * they are exactly the ones a grader still has to reach.
 */
export const findGradingQuestionIndexForPart = (
  questions: GradingQuestion[],
  partId: string,
): number =>
  questions.findIndex((question) =>
    question.parts.some(({ part }) => part.id === partId),
  );

/**
 * Heading segment naming the open question, or null on a one-question exam.
 *
 * Null rather than "Question 1" for the same reason the student view prints a
 * bare "Part A": every legacy document normalizes into exactly one question,
 * and those pages never carried a question number. Numbering them now would
 * reword an exam that is supposed to render unchanged.
 */
export const getQuestionLabel = (
  questionCount: number,
  questionIndex: number,
): string | null =>
  questionCount > 1 ? `Question ${questionIndex + 1}` : null;

/**
 * A blank grade for every part, keyed by part id.
 *
 * Part id is the key throughout: it is what the stored response map is keyed
 * by and what `FRQQuestionGrade.questionId` holds, so grouping parts under
 * questions changes what the grader pages through and nothing about how a
 * grade resolves.
 */
export const createEmptyGrades = (
  parts: FRQTemplatePart[],
): Record<string, PartGrade> =>
  Object.fromEntries(
    parts.map((part) => [
      part.id,
      {
        feedback: "",
        criteria: Object.fromEntries(
          (part.criteria ?? []).map((criterion) => [criterion.id, 0]),
        ),
      },
    ]),
  );

/**
 * Points earned on one part. Summed over the criteria the template defines
 * rather than over the keys present in the grade, so a criterion deleted from
 * the rubric after grading stops counting toward the total instead of
 * inflating a score against a line that no longer exists.
 */
export const getPartEarnedPoints = (
  part: FRQTemplatePart,
  grade: PartGrade | undefined,
) =>
  (part.criteria ?? []).reduce(
    (total, criterion) => total + (grade?.criteria[criterion.id] ?? 0),
    0,
  );

export const getEarnedPoints = (
  parts: FRQTemplatePart[],
  grades: Record<string, PartGrade>,
) =>
  parts.reduce(
    (total, part) => total + getPartEarnedPoints(part, grades[part.id]),
    0,
  );

/**
 * How many parts the grader has finished. A written note is the signal, since
 * it is the only thing that separates "read it and awarded zero" from "not
 * looked at yet"; every criterion starts at zero either way.
 */
export const countGradedParts = (
  parts: FRQTemplatePart[],
  grades: Record<string, PartGrade>,
) =>
  parts.filter((part) => (grades[part.id]?.feedback ?? "").trim().length > 0)
    .length;

/** Clamp a typed-in score to a whole number the criterion can actually award. */
export const clampCriterionPoints = (
  rawPoints: number,
  maximumPoints: number,
) =>
  Math.min(
    Math.max(Number.isFinite(rawPoints) ? Math.round(rawPoints) : 0, 0),
    maximumPoints,
  );

/**
 * The per-part array written to the graded document.
 *
 * `questionId` holds a part id despite its name. The field predates the
 * question/part split and every graded document in Firestore already resolves
 * through it, so renaming it would orphan them all.
 */
export const buildStoredGrades = (
  parts: FRQTemplatePart[],
  grades: Record<string, PartGrade>,
): FRQQuestionGrade[] =>
  parts.map((part) => ({
    questionId: part.id,
    feedback: grades[part.id]?.feedback?.trim() ?? "",
    criteria: (part.criteria ?? []).map((criterion) => ({
      criterionId: criterion.id,
      points: grades[part.id]?.criteria[criterion.id] ?? 0,
    })),
  }));
