export interface QuestionFile {
  key: string;
  url?: string;
  name: string;
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
  type: "mcq" | "multi-answer"; // Type of question - toggles betwen 1 choice vs multiple choices
  options: Option[]; // What the client can select as an answer to the question
  answers: string[]; // The correct answer(s)
  explanation: QuestionInput; // Explanation of the question
  content: QuestionInput; // Leftside content to be shown for test renderer
  bookmarked?: boolean; // for test renderer
}


export interface Props {
  questions: QuestionFormat[];
  setQuestions: (questions: QuestionFormat[]) => void;
}