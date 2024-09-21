import React, { useRef, useCallback, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { QuestionFormat } from "@/types/questions";

interface Props {
  questions: QuestionFormat[];
  setQuestions: (questions: QuestionFormat[]) => void;
  qIndex: number;
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

// Utility to retrieve a file from IndexedDB based on unique ID
export function getFileFromIndexedDB(name: string): Promise<File | null> {
  return new Promise((resolve) => {
    const dbRequest = indexedDB.open("mediaFilesDB", 1);

    dbRequest.onsuccess = () => {
      const db = dbRequest.result;
      const transaction = db.transaction("mediaFiles", "readonly");
      const objectStore = transaction.objectStore("mediaFiles");

      // Use the same unique ID to retrieve the file
      const uniqueId = `file_${name}`;
      const fileRequest = objectStore.get(uniqueId); // Fetch file by its unique ID

      fileRequest.onsuccess = () => {
        const fileBlob = fileRequest.result;
        if (fileBlob) {
          resolve(fileBlob); // Return the file directly
        } else {
          resolve(null); // Return null if no file found
        }
      };

      fileRequest.onerror = () => {
        console.error("Error retrieving file from IndexedDB");
        resolve(null);
      };
    };

    dbRequest.onerror = (error) => {
      console.error("Error opening IndexedDB:", error);
      resolve(null);
    };
  });
}

export default function AdvancedTextbox({
  questions,
  qIndex,
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
    const updatedQuestion: QuestionFormat = {
      ...questions[qIndex]!,
      body: { ...questions[qIndex]!.body, value: newText }, // Clone body
    };

    updatedQuestions[qIndex] = updatedQuestion;
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
      updatedQuestion.body.fileKey = `${file.type}-${file.lastModified}`;
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
        placeholder="Type or drag and drop here...latex syntax starts and ends with $!$ (eg: $@$e^{i\pi} + 1 = 0$@$)"
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
