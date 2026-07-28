import type { Timestamp } from "firebase/firestore";

/** An admin-authored prompt used by the digital FRQ testing experience. */
export interface FRQTemplate {
  id?: string;
  subject?: string;
  unitId?: string;
  title?: string;
  directions?: string;
  questions?: FRQTemplateQuestion[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FRQTemplateQuestion {
  /** Stable template-local identifier; never derived from display order. */
  id: string;
  title: string;
  prompt?: string;
}

/** A completed digital-test response awaiting staff grading. */
export interface GradableFRQSubmission {
  id?: string;
  templateId: string;
  studentId: string;
  /** Responses are keyed by a stable FRQTemplateQuestion.id. */
  responses: Record<string, string>;
  submittedAt: Timestamp;
}

/** The immutable grading result presented on a student's dashboard. */
export interface GradedFRQSubmission extends GradableFRQSubmission {
  score: string;
  feedback: string;
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
