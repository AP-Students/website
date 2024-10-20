import { Question } from "@/components/questions/digital-testing/testRenderer";
import { type Chapter } from ".";

export type Unit = {
  unit: number;
  title: string;
  chapters: Chapter[];
  test?: Question[];
};
