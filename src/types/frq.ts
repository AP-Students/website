import type { Timestamp } from "firebase/firestore";

/** An admin-authored prompt used by the digital FRQ testing experience. */
export interface FRQTemplate {
  id?: string;
  subject?: string;
  unitId?: string;
  title?: string;
  directions?: string;
  questions?: Array<{ title?: string; prompt?: string }>;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/** A completed digital-test response awaiting staff grading. */
export interface GradableFRQSubmission {
  id?: string;
  templateId: string;
  studentId: string;
  responses: string[];
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
