import { Question } from "@/app/questions/testRenderer";
import { type Chapter } from ".";

export type Unit = {
  unit: number;
  title: string;
  chapters: Chapter[];
  test?: Question[];
};
