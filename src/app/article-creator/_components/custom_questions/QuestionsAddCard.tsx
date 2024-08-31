import {
  BlockToolConstructable,
  BlockToolConstructorOptions,
  ToolConfig,
} from "@editorjs/editorjs";
import ReactDOM from "react-dom/client";
import { QuestionsInput } from "./QuestionInstance";
import { incrementQuestionInstanceId, getQuestionInstanceId } from "./instanceIDManager";

//@ts-expect-error
export class QuestionsAddCard implements BlockToolConstructable {
  private config: ToolConfig;
  private data: any;
  private instanceId: string;

  /**
   * Constructor for the QuestionsAddCard tool.
   *
   * @param {BlockToolConstructorOptions<any, any>} options - Configuration options passed from Editor.js
   */
  constructor({ data, config }: BlockToolConstructorOptions<any, any>) {
    this.data = data;
    this.config = config;

    // Increment instance ID only when the component is created, not on re-render
    incrementQuestionInstanceId();
    this.instanceId = getQuestionInstanceId().toString();
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
    root.render(<QuestionsInput instanceId={this.instanceId} />);
    console.log("questionInstanceId on render:", this.instanceId); 
    return wrapper;
  }

  save(blockContent: HTMLElement): { data: string } {
    return {
      data: "question_block",
    };
  }
}
