import { type Chapter } from ".";
import { QuestionFormat } from "./questions";

export type Unit = {
  unit: number;
  title: string;
  chapters: Chapter[];
  test?: {
    "questions": QuestionFormat[];
    "time": number;
    "module": string;
    // Any other meta data?
  }
};
