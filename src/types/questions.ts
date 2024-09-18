export type questionInput =
  | { type: "text"; value: string }
  | { type: "image"; value: File }
  | { type: "audio"; value: File };

export interface Option {
  // value: questionInput[];
  value: string;
  id: string;
}

export interface QuestionFormat {
  title: string;
  body: questionInput[];
  type: "mcq" | "multi-answer";
  options: Option[];
  correct: string[];
  explanation: string;
  course_id: string;
  unit_ids: string[];
  subunit_ids: string[];
}

export interface Props {
  questions: QuestionFormat[];
  setQuestions: (questions: QuestionFormat[]) => void;
}
