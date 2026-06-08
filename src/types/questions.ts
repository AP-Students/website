export interface QuestionFile {
  key: string;
  url?: string;
  name: string;
  id?: string;
  alt?: string;
  order?: number;
}


export interface QuestionInput {
  value: string;
  files: QuestionFile[];
}

export interface Option {
  value: QuestionInput;
  id: string;
}

export interface QuestionFormat {
  question: QuestionInput; // What the question is
  type: "mcq" | "multi-answer" | "frq"; // Type of question - mcq (1 choice), multi-answer (multiple choices), or frq (free response)
  options: Option[]; // Answer options (used for mcq/multi-answer; ignored for frq)
  answers: string[]; // Correct answer option ids (used for mcq/multi-answer; ignored for frq - the explanation holds the sample answer)
  explanation: QuestionInput; // Explanation of the question
  content: QuestionInput; // Leftside content to be shown for test renderer
  bookmarked?: boolean; // for test renderer
  topic: string;
}

export interface Props {
  questions: QuestionFormat[];
  setQuestions: (questions: QuestionFormat[]) => void;
}
