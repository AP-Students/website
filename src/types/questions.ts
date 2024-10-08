export type questionInput = {
  value: string;
  fileKey?: string;
  fileURL?: string;
}

export interface Option {
  value: questionInput;
  id: string;
}

export interface QuestionFormat {
  title: string;
  body: questionInput;
  type: "mcq" | "multi-answer";
  options: Option[];
  correct: string[];
  explanation: questionInput;
  course_id: string;
  unit_ids: string[];
  subunit_ids: string[];
}


export interface Props {
  questions: QuestionFormat[];
  setQuestions: (questions: QuestionFormat[]) => void;
}