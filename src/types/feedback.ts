import type { Timestamp } from "firebase/firestore";

export type FeedbackType = "bug" | "feedback" | "question";

export type BugType =
  | "article-errors"
  | "unit-test-errors"
  | "mock-exam-errors"
  | "website-bugs"
  | "other";

export type FeedbackStatus = "pending" | "approved" | "rejected";

export interface FeedbackSubmission {
  id: string;
  contact: string;
  type: FeedbackType;
  // Bug-specific fields
  bugType?: BugType;
  bugUrl?: string;
  // Common fields
  description: string;
  imageUrls: string[];
  // Metadata
  status: FeedbackStatus;
  submittedAt: Timestamp;
  submittedBy: string | null;
  // Review metadata (set after admin action)
  reviewedAt?: Timestamp;
  reviewedBy?: string;
  githubIssueUrl?: string;
  githubIssueNumber?: number;
}

/** Human-readable display labels for bug sub-types */
export const BUG_TYPE_LABELS: Record<BugType, string> = {
  "article-errors": "Website Article Errors",
  "unit-test-errors": "Unit Test Errors",
  "mock-exam-errors": "Mock Exam Errors",
  "website-bugs": "Website Bugs",
  other: "Other",
};

/** GitHub label mapping for bug sub-types */
export const BUG_TYPE_GITHUB_LABELS: Record<BugType, string | null> = {
  "article-errors": "article-errors",
  "unit-test-errors": "unit-tests",
  "mock-exam-errors": "mock-exam-errors",
  "website-bugs": "frontend/bug",
  other: null,
};

/** GitHub label mapping for feedback types */
export const FEEDBACK_TYPE_GITHUB_LABELS: Record<FeedbackType, string> = {
  bug: "Bug",
  feedback: "Feedback",
  question: "Question",
};
