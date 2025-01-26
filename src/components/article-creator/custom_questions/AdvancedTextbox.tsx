import React, { useRef, useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import type { QuestionFile, QuestionFormat, QuestionInput } from "@/types/questions";
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
  const [uploadedFiles, setUploadedFiles] = useState<QuestionFile[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize currentText and fileExists when question gets loaded from db if any
  useEffect(() => {
    if (origin === "option" && oIndex !== undefined) {
      if (questionInstance!.options[oIndex]?.value?.value) {
        setCurrentText(questionInstance!.options[oIndex].value.value);
      }

      setUploadedFiles(questionInstance!.options[oIndex]?.value?.files ?? []);

    } else if (
      origin === "question" ||
      origin === "explanation" ||
      origin === "content"
    ) {
      if (questionInstance![origin]?.value) {
        setCurrentText(questionInstance![origin].value);
      }
      setUploadedFiles(questionInstance![origin]?.files ?? []);
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
          files: questionInstance?.question.files, // Keep the files they exist
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
              files: questionInstance!.options[oIndex]!.value.files,
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
    const files = e.target.files ?? [];

    if (files.length === 0) {
      alert("No file selected. Try uploading again or contact support.");
      return; // Early return if file is not defined
    }

    const appendIfNewKey = (files: QuestionFile[], file: File, key: string) => {
      if (!files.map(file => file.key).includes(key)) {
        // Recreate the array here so that the set call later will work I think
        files = [...files, {
          name: file.name,
          key
        }];
      }
    };

    for (const file of files) {
      if (file.type.startsWith("image/") || file.type.startsWith("audio/")) {
        const fileKey = `${file.type}-${file.lastModified}`;

        // Store the file in IndexedDB using the unique ID
        storeFileInIndexedDB(fileKey, file);
  
        const updatedQuestions = [...questions];
        const updatedQuestion: QuestionFormat = { ...questionInstance! };
  
        if (origin === "question") {
          const questionInput: QuestionInput = { ...updatedQuestion.question };
          appendIfNewKey(questionInput.files, file, fileKey);
          updatedQuestion.question = questionInput;
          setUploadedFiles(questionInput.files);
        } else if (origin === "option" && oIndex !== undefined) {
          // Update a specific option by oIndex
          const optionInput: QuestionInput = {
            ...updatedQuestion.options[oIndex]!.value,
          };
          appendIfNewKey(optionInput.files, file, fileKey);
          updatedQuestion.options[oIndex]!.value = optionInput; // Update only the specified option
          setUploadedFiles(optionInput.files);
        } else if (origin === "explanation") {
          const questionInput: QuestionInput = { ...updatedQuestion.explanation };
          appendIfNewKey(questionInput.files, file, fileKey);
          updatedQuestion.explanation = questionInput;
          setUploadedFiles(questionInput.files);
        } else if (origin === "content") {
          const questionInput: QuestionInput = { ...updatedQuestion.content };
          appendIfNewKey(questionInput.files, file, fileKey);
          updatedQuestion.content = questionInput;
          setUploadedFiles(questionInput.files);
        }
        updatedQuestions[qIndex] = updatedQuestion;
  
        setQuestions(updatedQuestions);
      }
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

  const handleDeleteFile = (e: React.MouseEvent<HTMLButtonElement>) => {
    const fileKey = e.currentTarget.dataset.fileKey;

    if (!fileKey) {
      alert("Error deleting file, please try again");
      return;
    }

    const updatedQuestions = [...questions];
    const updatedQuestion: QuestionFormat = { ...questionInstance! };

    const deleteFile = (question: QuestionInput) => {
      deleteFileFromIndexedDB(fileKey).catch((error) => {
        console.error("Error deleting file from IndexedDB:", error);
      });
      deleteFileFromStorage(fileKey).catch((error) => {
        console.error("Error deleting file from Storage:", error);
      });

      question.files = question.files.filter(file => file.key !== fileKey);
      setUploadedFiles(question.files);
    };

    if (
      origin === "question" ||
      origin === "explanation" ||
      origin === "content"
    ) {
      const questionInput: QuestionInput = { ...updatedQuestion[origin] };

      deleteFile(questionInput);

      updatedQuestion[origin] = questionInput;
    } else if (origin === "option" && oIndex !== undefined) {
      const optionInput: QuestionInput = {
        ...updatedQuestion.options[oIndex]!.value,
      };

      deleteFile(optionInput);

      updatedQuestion.options[oIndex]!.value = optionInput;
    }

    updatedQuestions[qIndex] = updatedQuestion;
    setQuestions(updatedQuestions);
  };

  return (
    <div className="relative mb-4">
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
        multiple
      />

      {/* Section under the textarea for upload and delete buttons */}
      <div className="mt-2 flex gap-4">
        {uploadedFiles.length > 0 && uploadedFiles.map(file => <>
          <div>{file.name}</div>
          <button
            type="button"
            className="flex items-center text-red-500 hover:underline"
            onClick={handleDeleteFile}
            data-file-key={file.key}
          >
            Delete file <Trash className="ml-1 size-5" />
          </button></>
        )}
        <button
          type="button"
          className="flex items-center text-blue-500 hover:underline"
          onClick={handleUploadClick}
        >
          Add file <Paperclip className="ml-1 size-5" />
        </button>
        
      </div>
    </div>
  );
}
