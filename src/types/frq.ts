import type { Timestamp } from "firebase/firestore";

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
