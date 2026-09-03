import type { Block } from "editorjs-parser";
import type { QuestionFormat, QuestionInput } from "./questions";

export type Subject = {
  title: string;
  units: Unit[];
  hasUnit0?: boolean;
  referenceSheets?: ReferenceSheet[];
};

/** A course-scoped, natively-authored sheet of formulas/constants/etc. students can open while testing. */
export type ReferenceSheet = {
  id: string;
  title: string;
  content: QuestionInput;
};

export type Unit = {
  id: string;
  title: string;
  chapters: Chapter[];
  tests?: UnitTest[];
  // Use UnitTest.id as testId
  test?: boolean;
  testId?: string;
  frqs?: UnitFRQ[];
};

export type UnitTest = {
  id: string;
  name?: string;
  questions: QuestionFormat[];
  time: number;
  directions: string;
  isPublic?: boolean;
  referenceSheetEnabled?: boolean;
  referenceSheetId?: string;
};

export type UnitFRQ = {
  id: string;
  title?: string;
  isPublic?: boolean;
};

export type Chapter = {
  id: string;
  title: string;
  content?: Block;
  isPublic?: boolean;
};
