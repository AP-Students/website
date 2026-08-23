import type { FRQTemplate, FRQTemplatePart } from "@/types/frq";
import type { QuestionFile } from "@/types/questions";
import { getPartLabel, getStudentFacingQuestions } from "./template.ts";

/**
 * The model the test renderer pages through, kept apart from the component so
 * the labelling and lookup rules can be tested without mounting React. The
 * renderer used to derive part labels from a flat index, which is where an
 * off-by-one silently mislabels the box a student writes into.
 */

/** A part as it appears on screen, carrying the label the student reads. */
export interface StudentPart {
  part: FRQTemplatePart;
  /** "A", "B", ... Restarts at A inside every question, as AP prints them. */
  label: string;
}

/** One question the student can navigate to, with only its visible parts. */
export interface StudentQuestion {
  id: string;
  /**
   * Stimulus for this question alone. Distinct from the template's exam-wide
   * `directions`, which keeps its own pane: both may be present and neither
   * replaces the other.
   */
  stimulus?: string;
  stimulusFiles?: QuestionFile[];
  parts: StudentPart[];
}

/**
 * Build the student's navigation model. `getStudentFacingQuestions` has
 * already dropped legacy parts and any question left with none, so every entry
 * here is a page the student can actually reach and write on.
 */
export const buildStudentQuestions = (
  template: FRQTemplate,
): StudentQuestion[] =>
  getStudentFacingQuestions(template).map((question) => ({
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

/**
 * Every part id a student can write to, in reading order. The responses map
 * stays keyed by part id rather than by question, so in-progress work saved
 * before this change still resolves.
 */
export const getResponsePartIds = (questions: StudentQuestion[]): string[] =>
  questions.flatMap((question) => question.parts.map(({ part }) => part.id));

/**
 * Which question page a part sits on. Returns -1 when the part is not
 * student-facing, so a shortcut to a part that has since been marked legacy
 * lands nowhere instead of silently opening question 1.
 */
export const findQuestionIndexForPart = (
  questions: StudentQuestion[],
  partId: string,
): number =>
  questions.findIndex((question) =>
    question.parts.some(({ part }) => part.id === partId),
  );

/**
 * The strings the test page printed before section headings were authorable.
 * They are the fallback so an exam nobody has configured renders exactly as it
 * does today.
 *
 * The two sites have always disagreed on the subtitle: the review page prints
 * "Free-Response Questions" inside one combined heading, while the in-test
 * header prints "Free response" on its own line under the label. Each keeps
 * its own default instead of being unified, because unifying them would
 * reword one of the two pages for every exam already in the database.
 */
const DEFAULT_SECTION_LABEL = "Section II";
const DEFAULT_HEADER_SUBTITLE = "Free response";
const DEFAULT_REVIEW_SUBTITLE = "Free-Response Questions";

export interface SectionHeading {
  /** First line of the in-test header. */
  label: string;
  /** Second line, under the label. */
  subtitle: string;
  /** The review page's single combined heading. */
  reviewHeading: string;
}

/**
 * `normalizeFrqTemplate` guarantees `sectionLabel` and `sectionSubtitle` are
 * either a non-empty string or absent, so `??` never has to defend against a
 * stored "" that would render a blank heading.
 */
export const getSectionHeading = (template: FRQTemplate): SectionHeading => {
  const label = template.sectionLabel ?? DEFAULT_SECTION_LABEL;

  return {
    label,
    subtitle: template.sectionSubtitle ?? DEFAULT_HEADER_SUBTITLE,
    // Composed as "<label>: <subtitle>" so a template that configures both
    // reads the same on the review page as in the header. Only the fallback
    // subtitle differs, which is what holds an unconfigured exam on its
    // original wording.
    reviewHeading: `${label}: ${
      template.sectionSubtitle ?? DEFAULT_REVIEW_SUBTITLE
    }`,
  };
};
