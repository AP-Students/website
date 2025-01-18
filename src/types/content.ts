import type { OutputData } from "@editorjs/editorjs";
import type { User } from "./user";

export type Content = {
  displayName: string;
  title: string;
  creator: User;
  data: OutputData;
};