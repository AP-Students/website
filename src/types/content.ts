import { OutputData } from "@editorjs/editorjs";
import { User } from "./user";

export type Content = {
  title: string;
  creator: User;
  data: OutputData;
};