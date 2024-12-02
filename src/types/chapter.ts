import type { Block } from "editorjs-parser";

export type Chapter = {
  chapter: number;
  title: string;
  content?: Block;
};
