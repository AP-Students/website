import React, { useRef, useCallback, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { QuestionFormat, questionInput } from "@/types/questions";
import { QuestionsInput } from "./QuestionInstance";
import { FaTrash } from "react-icons/fa";
import { set } from "zod";

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

// Utility to remove a file from IndexedDB and revoke object URL
function deleteFileFromIndexedDB(name: string) {
  return new Promise<void>((resolve, reject) => {
    const dbRequest = indexedDB.open("mediaFilesDB", 1);

    dbRequest.onsuccess = () => {
      const db = dbRequest.result;
      const transaction = db.transaction("mediaFiles", "readwrite");
      const objectStore = transaction.objectStore("mediaFiles");

      const deleteRequest = objectStore.delete(`file_${name}`);

      deleteRequest.onsuccess = () => {
        resolve();
      };

      deleteRequest.onerror = () => {
        console.error(`Failed to delete file ${name} from IndexedDB`);
        reject();
      };
    };
  });
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
  const [fileExists, setFileExists] = useState<boolean>(false);
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
          fileKey: questions[qIndex]?.body.fileKey, // Keep the file key if it exists
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
              fileKey: questions[qIndex]!.options[oIndex]!.value.fileKey,
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
        setFileExists(true);
      } else if (origin === "option" && oIndex !== undefined) {
        // Update a specific option by oIndex
        const optionInput: questionInput = { ...updatedQuestion.options[oIndex]!.value };
        optionInput.fileKey = `${file.type}-${file.lastModified}`;
        updatedQuestion.options[oIndex]!.value = optionInput; // Update only the specified option 
        setFileExists(true);
      } else if (origin === "explanation") {
        const questionInput: questionInput = { ...updatedQuestion.explanation };
        questionInput.fileKey = `${file.type}-${file.lastModified}`;
        updatedQuestion.explanation = questionInput;
        setFileExists(true);
      }
      updatedQuestions[qIndex] = updatedQuestion;

      setQuestions(updatedQuestions);
    }

    setDragActive(false);
  };

  const handleDeleteFile = () => {
    const updatedQuestions = [...questions];
    const updatedQuestion: QuestionFormat = { ...questions[qIndex]! };

    if (origin === "body" || origin === "explanation") {
      const questionInput: questionInput = { ...updatedQuestion.body };
      deleteFileFromIndexedDB(questionInput.fileKey!); 
      questionInput.fileKey = undefined; 
      updatedQuestion[origin] = questionInput; 
    } else if (origin === "option" && oIndex !== undefined) {
      const optionInput: questionInput = { ...updatedQuestion.options[oIndex]!.value };
      deleteFileFromIndexedDB(optionInput.fileKey!); 
      optionInput.fileKey = undefined; 
      updatedQuestion.options[oIndex]!.value = optionInput;
    }

    updatedQuestions[qIndex] = updatedQuestion;
    setQuestions(updatedQuestions);
    setFileExists(false);
  }

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
        placeholder={placeholder || "Type or drag and drop here (only 1 file allowed). Latex syntax starts with $@ and ends with $ (eg: $@e^{i\pi} + 1 = 0$)"}  
      />
      {fileExists && (
        <button
          type="button"
          className="absolute right-2 top-2 text-red-500 hover:text-red-700"
          onClick={handleDeleteFile}
        >
          <FaTrash />
        </button>
      )}
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
