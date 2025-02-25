import type { Block } from "editorjs-parser";
import type { QuestionFormat } from "./questions";

export type Subject = {
  title: string;
  units: Unit[];
};

export type Unit = {
  id: string;
  title: string;
  chapters: Chapter[];
  tests?: UnitTest[];
  // Use UnitTest.id as testId
  test?: boolean;
  testId?: string;
};

export type UnitTest = {
  id: string;
  name?: string;
  questions: QuestionFormat[];
  time: number;
  directions:string;
};

export type Chapter = {
  id: string;
  title: string;
  content?: Block;
};
