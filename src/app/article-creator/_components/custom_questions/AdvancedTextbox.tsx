import React, { useRef, useCallback, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { QuestionFormat, questionInput } from "@/types/questions";
import { QuestionsInput } from "./QuestionInstance";

interface Props {
  questions: QuestionFormat[];
  setQuestions: (questions: QuestionFormat[]) => void;
  origin: "body" | "option" | "explanation";
  qIndex: number;
  placeholder?: string;
  oIndex?: number | undefined;
}

// Utility to store a file in IndexedDB with a unique key for each instance
function storeFileInIndexedDB(name: string, file: File) {
  const dbRequest = indexedDB.open("mediaFilesDB", 1);

  dbRequest.onupgradeneeded = (event) => {
    const db = (event.target as IDBOpenDBRequest).result;
    if (!db.objectStoreNames.contains("mediaFiles")) {
      db.createObjectStore("mediaFiles", { keyPath: "id" }); // Unique ID for each file
    }
  };

  dbRequest.onsuccess = () => {
    const db = dbRequest.result;
    const transaction = db.transaction("mediaFiles", "readwrite");
    const objectStore = transaction.objectStore("mediaFiles");

    // Create a unique ID based on instance, question index, and block index
    const uniqueId = `file_${name}`;

    const fileBlob = { id: uniqueId, file }; // Store the file with its unique ID
    objectStore.put(fileBlob); // Insert into the object store
  };
}

export default function AdvancedTextbox({
  questions,
  qIndex,
  origin,
  placeholder,
  oIndex,
  setQuestions,
}: Props) {
  const [dragActive, setDragActive] = useState(false);
  const [currentText, setCurrentText] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Keys are being handled by EditorJS rather than default behavior, so we need to block the EditorJS behavior
    const key = e.key;

    if (
      key === "ArrowUp" ||
      key === "ArrowDown" ||
      key === "ArrowLeft" ||
      key === "ArrowRight" ||
      key === "Backspace"
    ) {
      e.stopPropagation();
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setCurrentText(newText);
    // Clone the current question to avoid direct mutation
    const updatedQuestions = [...questions];
    if (origin === "body" || origin === "explanation") {
      const updatedQuestion: QuestionFormat = {
        ...questions[qIndex]!,
        [origin]: {
          ...(questions[qIndex] ? [origin] : QuestionsInput),
          value: newText,
        }, // Clone body
      };
      updatedQuestions[qIndex] = updatedQuestion;
    } 
    else if (origin === "option" && oIndex !== undefined) { // oIndex !== undefined because 0 is falsy
      const updatedQuestion: QuestionFormat = {
        ...questions[qIndex]!,
        options: [
          ...questions[qIndex]!.options.slice(0, oIndex),
          {
            value: {
              value: newText,
            },
            id: questions[qIndex]!.options[oIndex]!.id,
          },
          ...questions[qIndex]!.options.slice(oIndex + 1),
        ],
      };
      updatedQuestions[qIndex] = updatedQuestion;
    }
    
    setQuestions(updatedQuestions); // Update state immutably
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.stopPropagation(); // Stop propagation
    e.preventDefault(); // Prevent default behavior
    const file = e.dataTransfer.files[0];

    if (file?.type.startsWith("image/") || file?.type.startsWith("audio/")) {
      // Store the file in IndexedDB using the unique ID
      storeFileInIndexedDB(`${file.type}-${file.lastModified}`, file);

      const updatedQuestions = [...questions];
      const updatedQuestion: QuestionFormat = { ...questions[qIndex]! };

      if (origin === "body") {
        const questionInput: questionInput = { ...updatedQuestion.body };
        questionInput.fileKey = `${file.type}-${file.lastModified}`;
        updatedQuestion.body = questionInput;
      } else if (origin === "option" && oIndex !== undefined) {
        // Update a specific option by oIndex
        const optionInput: questionInput = { ...updatedQuestion.options[oIndex]!.value };
        optionInput.fileKey = `${file.type}-${file.lastModified}`;
        updatedQuestion.options[oIndex]!.value = optionInput; // Update only the specified option 

        console.log("updatedQuestion", updatedQuestion);
      } else if (origin === "explanation") {
        const questionInput: questionInput = { ...updatedQuestion.explanation };
        questionInput.fileKey = `${file.type}-${file.lastModified}`;
        updatedQuestion.explanation = questionInput;
      }
      updatedQuestions[qIndex] = updatedQuestion;

      setQuestions(updatedQuestions);
    }

    setDragActive(false);
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        className="h-40 w-full resize-none focus:outline-none"
        value={currentText}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        onDrop={handleFileDrop}
        onDragEnter={handleDrag}
        placeholder={placeholder || "Type or drag and drop here...latex syntax starts with $@ and ends with $ (eg: $@e^{i\pi} + 1 = 0$)"} 
      />
      {dragActive && (
        <div
          className="absolute inset-0 h-full w-full rounded-lg border-2 border-dashed border-primary bg-primary/10"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleFileDrop}
        />
      )}
    </div>
  );
}
