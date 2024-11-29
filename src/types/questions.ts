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
  question: questionInput; // What the question is 
  type: "mcq" | "multi-answer"; // Type of question - toggles betwen 1 choice vs multiple choices
  options: Option[]; // What the client can select as an answer to the question
  answers: string[]; // The correct answer(s)
  explanation: questionInput; // Explanation of the question
  content: questionInput; // Leftside content to be shown for test renderer
  bookmarked?: boolean; // for test renderer
}


export interface Props {
  questions: QuestionFormat[];
  setQuestions: (questions: QuestionFormat[]) => void;
}