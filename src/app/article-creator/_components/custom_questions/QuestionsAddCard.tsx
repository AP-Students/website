import {
  BlockToolConstructable,
  BlockToolConstructorOptions,
  ToolConfig,
} from "@editorjs/editorjs";
import ReactDOM from "react-dom/client";
import { QuestionsInput } from "./QuestionInstance";
import { v4 as uuidv4 } from "uuid";
import { QuestionFormat } from "@/types/questions";

//@ts-expect-error
export class QuestionsAddCard implements BlockToolConstructable {
  private config: ToolConfig;
  private data: any;
  public instanceId: string;
  private questions: QuestionFormat[];

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

  save(blockContent: HTMLElement): { instanceId: string; questions: QuestionFormat[] } {
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
