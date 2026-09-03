import type { Block } from "editorjs-parser";
import type { QuestionFormat } from "./questions";
import type { CalculatorPermission, CalculatorType } from "@/lib/calculator";

export type Subject = {
  title: string;
  units: Unit[];
  hasUnit0?: boolean;
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
  /** Default calculator setting for every question; absent/"not-allowed" means no calculator. */
  calculatorDefault?: CalculatorPermission;
  /** Which Desmos calculator to offer when the calculator is allowed. */
  calculatorType?: CalculatorType;
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
