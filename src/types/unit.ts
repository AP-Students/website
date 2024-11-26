import { type Chapter } from ".";
import { type QuestionFormat } from "./questions";

export type Unit = {
  unit: number;
  title: string;
  chapters: Chapter[];
  test?: {
    "questions": QuestionFormat[];
    "time": number;
    "optedIn": boolean;
    "instanceId": string;
    // Any other meta data?
  }
};
