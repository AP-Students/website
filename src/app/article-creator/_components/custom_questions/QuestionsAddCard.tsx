import {
  BlockToolConstructable,
  BlockToolConstructorOptions,
  ToolConfig,
} from "@editorjs/editorjs";
import ReactDOM from "react-dom/client";
import { QuestionsInput } from "./QuestionInstance";
import { questionInstanceId } from "../Renderer"; 

//@ts-expect-error
export class QuestionsAddCard implements BlockToolConstructable {
  private config: ToolConfig;
  private data: any;

  /**
   * Constructor for the QuestionsAddCard tool.
   *
   * @param {BlockToolConstructorOptions<any, any>} options - Configuration options passed from Editor.js
   */
  constructor({ data, config }: BlockToolConstructorOptions<any, any>) {
    this.data = data;
    this.config = config;
  }

  static get toolbox() {
    return {
      title: "Questions",
      icon: "?", // You can use an SVG or any other icon
    };
  }

  render(): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.classList.add("custom-question-tool");
    const root = ReactDOM.createRoot(wrapper);
    root.render(<QuestionsInput instanceId={questionInstanceId.toString()} />);
    console.log("questionInstanceId:", questionInstanceId); 
    return wrapper;
  }

  save(blockContent: HTMLElement): { data: string } {
    return {
      data: "question_block",
    };
  }
}
