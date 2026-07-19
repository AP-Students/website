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
  answerType: "text";
  gradingCriteria: GradingCriterion[];
}


export interface FRQQuestion {
  id: string;
  name: string;
  description: QuestionInput;
  isVisible: boolean;
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