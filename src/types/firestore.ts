import type { Block } from "editorjs-parser";
import type { QuestionFormat } from "./questions";

export type Subject = {
  title: string;
  units: Unit[];
};

export type Unit = {
  title: string;
  chapters: string[];
  test: boolean;
};

export type UnitTest = {
  instanceId: string;
  questions: QuestionFormat[];
  time: number;
};

export type Chapter = {
  title: string;
  content?: Block;
};
