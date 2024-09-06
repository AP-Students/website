export interface Option {
  value: string;
  id: string;
}

export interface QuestionFormat {
  body: string;
  title: string;
  displayNumAnswers: boolean;
  options: Option[];
  correct: string[];
  course_id: string;
  unit_ids: string[];
  subunit_ids: string[];
}

export interface Props {
  questions: QuestionFormat[];
  setQuestions: (questions: QuestionFormat[]) => void;
}
