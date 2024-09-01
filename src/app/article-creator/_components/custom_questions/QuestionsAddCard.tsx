import {
  BlockToolConstructable,
  BlockToolConstructorOptions,
  ToolConfig,
} from "@editorjs/editorjs";
import ReactDOM from "react-dom/client";
import { QuestionsInput } from "./QuestionInstance";
import { v4 as uuidv4 } from 'uuid';

//@ts-expect-error
export class QuestionsAddCard implements BlockToolConstructable {
  private config: ToolConfig;
  private data: any;
  public instanceId: string;

  /**
   * Constructor for the QuestionsAddCard tool.
   *
   * @param {BlockToolConstructorOptions<any, any>} options - Configuration options passed from Editor.js
   */
  constructor({ data, config }: BlockToolConstructorOptions<any, any>) {
    this.data = data;
    this.config = config;

   // Use existing UUID from data or generate a new one if not provided
   this.instanceId = data.instanceId || uuidv4();
   this.data = data;
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
    return wrapper;
  }

  save(blockContent: HTMLElement): { instanceId: string } {
    return {
      instanceId: this.instanceId,
    };
  }
}