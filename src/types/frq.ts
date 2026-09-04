import type { Timestamp } from "firebase/firestore";
import type { QuestionFile } from "@/types/questions";

/** How a student is expected to answer a single FRQ part. */
export type FRQAnswerType = "text" | "equation";

/**
 * Whether a part is shown to students. "legacy" parts stay attached to the
 * template so old submissions still resolve their prompts, but new test takers
 * never see them.
 */
export type FRQQuestionStatus = "public" | "legacy";

/**
 * One line of a part's rubric. Points are the single source of truth for what a
 * part is worth: the editor, the grading page, and the student's feedback page
 * all derive totals by summing these, so none of them can disagree.
 */
export interface FRQGradingCriterion {
  id: string;
  description: string;
  points: number;
}

/** One part — the unit a student writes a single response to. */
export interface FRQTemplatePart {
  /** Stable template-local identifier; never derived from display order. */
  id: string;
  title: string;
  /** Authored prompt text. Files referenced by it live in `promptFiles`. */
  prompt?: string;
  promptFiles?: QuestionFile[];
  answerType?: FRQAnswerType;
  status?: FRQQuestionStatus;
  criteria?: FRQGradingCriterion[];
}

/**
 * One numbered question: its own stimulus plus the parts hanging off it.
 * Part labels restart at A within each question, which is how AP numbers them.
 */
export interface FRQTemplateQuestion {
  /** Stable template-local identifier; never derived from display order. */
  id: string;
  /** Stimulus shown in the left pane while this question is open. */
  stimulus?: string;
  stimulusFiles?: QuestionFile[];
  parts: FRQTemplatePart[];
}

/** An admin-authored prompt used by the digital FRQ testing experience. */
export interface FRQTemplate {
  id?: string;
  subject: string;
  unitId: string;
  title: string;
  /**
   * Stimulus and directions shown in the left-hand pane of the test. Stored as
   * text plus a file list rather than a nested object so that documents written
   * before the editor could save still load without migration.
   */
  directions: string;
  directionsFiles?: QuestionFile[];
  /**
   * Section heading shown while taking the test, e.g. "Section II" or
   * "Section I, Part B". Absent on templates authored before this was
   * configurable, which fall back to the original hardcoded strings.
   */
  sectionLabel?: string;
  sectionSubtitle?: string;
  questions: FRQTemplateQuestion[];
  isPublic?: boolean;
  /** Minutes on the test clock. Absent on templates authored before timing. */
  timeLimitMinutes?: number;
  /** Whether the subject's reference sheet is offered while taking this FRQ. */
  referenceSheetEnabled?: boolean;
  /** Id into the subject document's `referenceSheets`. */
  referenceSheetId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/** A completed digital-test response awaiting staff grading. */
export interface GradableFRQSubmission {
  id?: string;
  templateId: string;
  subject: string;
  unitId: string;
  studentId: string;
  /** Responses are keyed by a stable FRQTemplatePart.id. */
  responses: Record<string, string>;
  submittedAt: Timestamp;
}

/** Points a grader awarded for one rubric line. */
export interface FRQCriterionScore {
  criterionId: string;
  points: number;
}

/**
 * A grader's verdict on a single part. Stored per part rather than as one
 * aggregate blob so the student's feedback page can show which rubric lines
 * were earned and what the grader said about each part.
 */
export interface FRQQuestionGrade {
  /**
   * The id of the FRQTemplatePart this grade covers. Named `questionId`
   * because it is a stored field in `graded-frqs` that predates the
   * question/part split — renaming it would orphan existing documents.
   */
  questionId: string;
  feedback: string;
  criteria: FRQCriterionScore[];
}

/** The immutable grading result presented on a student's dashboard. */
export interface GradedFRQSubmission extends GradableFRQSubmission {
  /** Human-readable aggregate, e.g. "4/6". Derived from `grades`. */
  score: string;
  /** Overall comment. Per-part comments live in `grades`. */
  feedback: string;
  grades: FRQQuestionGrade[];
  graderId: string;
  gradedAt: Timestamp;
  sourceSubmissionId: string;
}

export interface FRQSubmission {
  id?: string;
  userId: string;
  questionId: string;
  responseText: string;
  submittedAt: Timestamp;
  grade?: string;
  feedback?: string;
  gradedAt?: Timestamp;
  gradedBy?: string;
  status?: GradingStatus;
  userBanned?: boolean;
  question?: {
    id: string;
  };
}

export type GradingStatus = "ungraded" | "graded" | "flagged" | "rejected";
