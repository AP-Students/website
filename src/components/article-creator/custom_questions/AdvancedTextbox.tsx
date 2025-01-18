import React, { useRef, useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { type QuestionFormat, type questionInput } from "@/types/questions";
import { QuestionsInput } from "./QuestionInstance";
import { Paperclip, Trash } from "lucide-react";
import { deleteObject, getStorage, ref } from "firebase/storage";
import { getUser } from "@/components/hooks/users";

interface Props {
  questions: QuestionFormat[];
  setQuestions: (questions: QuestionFormat[]) => void;
  origin: "question" | "option" | "explanation" | "content";
  qIndex: number;
  placeholder?: string;
  oIndex?: number | undefined;
}

// Utility to store a file in IndexedDB with a unique key for each instance
function storeFileInIndexedDB(name: string, file: File) {
  const dbRequest = indexedDB.open("mediaFilesDB", 2);

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
    const dbRequest = indexedDB.open("mediaFilesDB", 2);

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
  const questionInstance = questions[qIndex];
  const [currentText, setCurrentText] = useState<string>("");
  const [fileExists, setFileExists] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize currentText and fileExists when question gets loaded from db if any
  useEffect(() => {
    if (origin === "option" && oIndex !== undefined) {
      if (questionInstance!.options[oIndex]?.value?.value) {
        setCurrentText(questionInstance!.options[oIndex].value.value);
      }

      if (questionInstance!.options[oIndex]?.value?.fileKey) {
        setFileExists(true);
      }
    } else if (
      origin === "question" ||
      origin === "explanation" ||
      origin === "content"
    ) {
      if (questionInstance![origin]?.value) {
        setCurrentText(questionInstance![origin].value);
      }
      if (questionInstance![origin]?.fileKey) {
        setFileExists(true);
      }
    }
  }, [questionInstance, oIndex, origin]);

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

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setCurrentText(newText);
    // Clone the current question to avoid direct mutation
    const updatedQuestions = [...questions];
    if (
      origin === "question" ||
      origin === "explanation" ||
      origin === "content"
    ) {
      const updatedQuestion: QuestionFormat = {
        ...questionInstance!,
        [origin]: {
          ...(questionInstance ? [origin] : QuestionsInput),
          value: newText,
          fileKey: questionInstance?.question.fileKey, // Keep the file key if it exists
        }, // Clone question
      };
      updatedQuestions[qIndex] = updatedQuestion;
    } else if (origin === "option" && oIndex !== undefined) {
      // oIndex !== undefined because 0 is falsy
      const updatedQuestion: QuestionFormat = {
        ...questionInstance!,
        options: [
          ...questionInstance!.options.slice(0, oIndex),
          {
            value: {
              value: newText,
              fileKey: questionInstance!.options[oIndex]!.value.fileKey,
            },
            id: questionInstance!.options[oIndex]!.id,
          },
          ...questionInstance!.options.slice(oIndex + 1),
        ],
      };
      updatedQuestions[qIndex] = updatedQuestion;
    }

    setQuestions(updatedQuestions); // Update state immutably
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      alert("No file selected. Try uploading again or contact support.");
      return; // Early return if file is not defined
    }

    if (file.type.startsWith("image/") || file.type.startsWith("audio/")) {
      // Store the file in IndexedDB using the unique ID
      storeFileInIndexedDB(`${file.type}-${file.lastModified}`, file);

      const updatedQuestions = [...questions];
      const updatedQuestion: QuestionFormat = { ...questionInstance! };

      if (origin === "question") {
        const questionInput: questionInput = { ...updatedQuestion.question };
        questionInput.fileKey = `${file.type}-${file.lastModified}`;
        updatedQuestion.question = questionInput;
        setFileExists(true);
      } else if (origin === "option" && oIndex !== undefined) {
        // Update a specific option by oIndex
        const optionInput: questionInput = {
          ...updatedQuestion.options[oIndex]!.value,
        };
        optionInput.fileKey = `${file.type}-${file.lastModified}`;
        updatedQuestion.options[oIndex]!.value = optionInput; // Update only the specified option
        setFileExists(true);
      } else if (origin === "explanation") {
        const questionInput: questionInput = { ...updatedQuestion.explanation };
        questionInput.fileKey = `${file.type}-${file.lastModified}`;
        updatedQuestion.explanation = questionInput;
        setFileExists(true);
      }
      if (origin === "content") {
        const questionInput: questionInput = { ...updatedQuestion.content };
        questionInput.fileKey = `${file.type}-${file.lastModified}`;
        updatedQuestion.content = questionInput;
        setFileExists(true);
      }
      updatedQuestions[qIndex] = updatedQuestion;

      setQuestions(updatedQuestions);
    }
  };

  // Function to delete a file from Firebase Storage
  async function deleteFileFromStorage(fileKey: string): Promise<void> {
    const user = await getUser();

    if (!user || (user.access !== "admin" && user.access !== "member")) {
      alert("User is not authorized to perform this action.");
      return;
    }

    const storage = getStorage();
    const storageRef = ref(storage, fileKey);

    try {
      if (!storageRef) return;
      await deleteObject(storageRef);
    } catch (error) {
      console.error(`Error deleting file ${fileKey} from storage:`, error);
      // You might want to handle specific error codes here
      return;
    }
  }

  const handleDeleteFile = () => {
    const updatedQuestions = [...questions];
    const updatedQuestion: QuestionFormat = { ...questionInstance! };

    if (
      origin === "question" ||
      origin === "explanation" ||
      origin === "content"
    ) {
      const questionInput: questionInput = { ...updatedQuestion[origin] };

      deleteFileFromIndexedDB(questionInput.fileKey!).catch((error) => {
        console.error("Error deleting file from IndexedDB:", error);
      });
      deleteFileFromStorage(questionInput.fileKey!).catch((error) => {
        console.error("Error deleting file from Storage:", error);
      });

      questionInput.fileKey = "";
      questionInput.fileURL = "";
      updatedQuestion[origin] = questionInput;
    } else if (origin === "option" && oIndex !== undefined) {
      const optionInput: questionInput = {
        ...updatedQuestion.options[oIndex]!.value,
      };

      deleteFileFromIndexedDB(optionInput.fileKey!).catch((error) => {
        console.error("Error deleting file from IndexedDB:", error);
      });
      deleteFileFromStorage(optionInput.fileKey!).catch((error) => {
        console.error("Error deleting file from Storage:", error);
      });

      optionInput.fileKey = "";
      optionInput.fileURL = "";
      updatedQuestion.options[oIndex]!.value = optionInput;
    }

    updatedQuestions[qIndex] = updatedQuestion;
    setQuestions(updatedQuestions);
    setFileExists(false);
  };

  return (
    <div className="relative mb-2">
      <Textarea
        ref={textareaRef}
        value={currentText}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={
          placeholder ??
          "Type or drag and drop here (only 1 file allowed). Latex syntax starts with $@ and ends with $ (eg: $@e^{ipi} + 1 = 0$)"
        }
      />

      <input
        type="file"
        accept="image/*,audio/*"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileUpload}
      />

      {/* Section under the textarea for upload and delete buttons */}
      <div className="absolute -top-8 left-1/2 mt-2 flex -translate-x-1/2 gap-6">
        <button
          type="button"
          className="flex items-center text-blue-500 hover:underline"
          onClick={handleUploadClick}
        >
          Add file <Paperclip className="ml-1 size-5" />
        </button>
        {fileExists && (
          <button
            type="button"
            className="flex items-center text-red-500 hover:underline"
            onClick={handleDeleteFile}
          >
            Delete file <Trash className="ml-1 size-5" />
          </button>
        )}
      </div>
    </div>
  );
}
