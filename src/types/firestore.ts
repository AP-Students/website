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
  test: boolean;
  testId?: string;
};

export type UnitTest = {
  id: string;
  questions: QuestionFormat[];
  time: number;
};

export type Chapter = {
  id: string;
  title: string;
  content?: Block;
};
