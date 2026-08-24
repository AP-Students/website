import type { FRQAnswerType } from "@/types/frq";
import type { QuestionInput } from "@/types/questions";

export interface RubricScore {
  criterionId: string;
  points: number;
}

export interface FRQPartFeedback {
  questionId: string;
  feedback: string;
  gradingCriteria: RubricScore[];
}

export interface FRQFeedback {
  id: string;
  graderId: string;
  submittedAt: string;
  questions: FRQPartFeedback[];
}

export interface ResponseAnswer {
  questionId: string;
  value: string;
}

export interface FRQResponse {
  id: string;
  userId: string;
  submittedAt: string;
  answers: ResponseAnswer[];
}

export interface GradingCriterion {
  id: string;
  text: string;
  points: number;
}

export interface FRQPart {
  id: string;
  name: string;
  isVisible: boolean;
  prompt: QuestionInput;
  /** Mirrors the template's part. Nothing branches on it yet. */
  answerType: FRQAnswerType;
  gradingCriteria: GradingCriterion[];
}

export interface FRQQuestion {
  id: string;
  name: string;
  /**
   * The exam-wide directions, repeated on every question's page the way the
   * test itself repeats them. Distinct from `stimulus`, which belongs to this
   * question alone: both may be present and neither replaces the other.
   */
  description: QuestionInput;
  stimulus?: QuestionInput;
  isVisible: boolean;
  /** This question's parts. Named `questions` since before parts existed. */
  questions: FRQPart[];
}

export interface FRQFeedbackDocument {
  name: string;
  creatorID: string;
  mostRecentEditor: string;
  id: string;
  isVisible: boolean;
  feedback: FRQFeedback;
  response: FRQResponse;
  frqs: FRQQuestion[];
}
