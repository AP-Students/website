import {
  type BlockToolConstructable,
  type BlockToolConstructorOptions,
  type ToolConfig,
} from "@editorjs/editorjs";
import ReactDOM from "react-dom/client";
import { QuestionsInput } from "./QuestionInstance";
import { v4 as uuidv4 } from "uuid";
import { type QuestionFormat } from "@/types/questions";

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
//@ts-expect-error I think its cuz typescript doesnt recognize BlockToolConstructable as a type, but i cant be sure; didnt make this code. 
export class QuestionsAddCard implements BlockToolConstructable {
  private config: ToolConfig;
  private data: any;
  public instanceId: string;
  public questions: QuestionFormat[];

  constructor({ data, config }: BlockToolConstructorOptions<any, any>) {
    this.data = data;
    this.config = config;
    this.instanceId = data.instanceId || uuidv4();
    this.questions = [];
  }

  static get toolbox() {
    return {
      title: "Questions",
      icon: "?", 
    };
  }

  render(): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.classList.add("custom-question-tool");
    const root = ReactDOM.createRoot(wrapper);

    root.render(<QuestionsInput instanceId={this.instanceId} />);
    return wrapper;
  }

  save(): { instanceId: string; questions: QuestionFormat[] } {
    // Load questions from localStorage or initialize to an empty array
    const storageKey = `questions_${this.instanceId}`;
    const savedQuestions = localStorage.getItem(storageKey);
    this.questions = savedQuestions ? JSON.parse(savedQuestions) : this.data.questions;

    const saveData = {
      instanceId: this.instanceId,
      questions: this.questions,
    };

    return saveData;
  }
}
