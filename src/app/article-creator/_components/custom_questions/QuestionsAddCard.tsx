import {
  BlockToolConstructable,
  BlockToolConstructorOptions,
  ToolConfig,
} from "@editorjs/editorjs";
import ReactDOM from "react-dom/client";
import { QuestionsInput } from "./QuestionInstance";
import { v4 as uuidv4 } from "uuid";
import { QuestionFormat } from "@/types/questions";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getUser } from "@/components/hooks/users";

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

  // Function to repropagate the questions with parsed data and file URLs
  private async repropagateQuestions() {
    const user = await getUser();  

    if(user && (user.access !== "admin" && user.access !== "member")) {
      console.log("User is not authorized to perform this action.");
      return;
    }

    const storageKey = `questions_${this.instanceId}`;
    
    try {
      // Load questions from Firestore, if available
      const docRef = doc(db, "pages", "calculus-ab-limits-and-continuity-1");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data().data.blocks;
        data.forEach((block: any) => {
          if (block.type === "questionsAddCard") {
            const questionsFromDb: QuestionFormat[] = block.data.questions.map((question: any) => ({
              ...question,
              body: question.body || { value: "" },  // Ensure body exists
              options: question.options.map((option: any) => ({
                ...option,
                value: option.value || { value: "" },  // Ensure value exists
              })),
              correct: question.correct || [],
              explanation: question.explanation || { value: "" },
              course_id: question.course_id || "",
              unit_ids: question.unit_ids || [],
              subunit_ids: question.subunit_ids || [],
            }));
    
            // Update local storage
            localStorage.setItem(storageKey, JSON.stringify(questionsFromDb));

             // Trigger a manual event to notify listeners that localStorage was updated
             const event = new Event("questionsUpdated");
             window.dispatchEvent(event);
          }
        });
      } else {
        console.log("No document found for questions");
        return this.data.questions || []; 
      }
    } catch (error) {
      console.error("Error fetching questions from Firestore:", error);
      return [];
    }
  }

  render(): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.classList.add("custom-question-tool");
    const root = ReactDOM.createRoot(wrapper);
    // Repropagate questions and set the state
    this.repropagateQuestions().then((questionsFromDb) => {
      console.log("questionsFromDb:", questionsFromDb);
      this.questions = questionsFromDb;
    });

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
