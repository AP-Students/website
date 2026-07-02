/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import React, { useRef, useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import type { QuestionFile, QuestionFormat } from "@/types/questions";
import { Paperclip, Trash, ChevronLeft, ChevronRight } from "lucide-react";
import {
  deleteObject,
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { getUser } from "@/components/hooks/users";
import { getFileFromIndexedDB } from "./RenderAdvancedTextbox";
import { isSvgFileName, resolveUploadContentType } from "@/lib/utils";

interface Props {
  questions: QuestionFormat[];
  setQuestions: (questions: QuestionFormat[]) => void;
  origin: "question" | "option" | "explanation" | "content";
  qIndex: number;
  placeholder?: string;
  oIndex?: number | undefined;
  setUnsavedChanges?: (unchangedChanges: boolean) => void;
}

function isStorageObjectNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "storage/object-not-found"
  );
}

// Utility to store a file in IndexedDB with a unique key for each instance
function storeFileInIndexedDB(name: string, file: File) {
  const dbRequest = indexedDB.open("mediaFilesDB", 3);

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
    const dbRequest = indexedDB.open("mediaFilesDB", 3);

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

function areFilesEqual(a: QuestionFile[], b: QuestionFile[]) {
  if (a.length !== b.length) return false;

  return a.every((file, index) => {
    const other = b[index];
    return (
      !!other &&
      file.key === other.key &&
      file.url === other.url &&
      file.name === other.name &&
      file.alt === other.alt &&
      file.order === other.order
    );
  });
}

// Helper component to display visual thumbnails/previews of files in editing mode
const ThumbnailPreview: React.FC<{ file: QuestionFile }> = ({ file }) => {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;
    if (file.url) {
      setSrc(file.url);
      return;
    }

    const loadLocal = async () => {
      try {
        const stored = await getFileFromIndexedDB(file.key);
        if (stored?.file) {
          url = URL.createObjectURL(stored.file);
          setSrc(url);
        }
      } catch (err) {
        console.error("Error loading thumbnail:", err);
      }
    };
    void loadLocal();

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [file]);

  if (!src) {
    return (
      <div className="flex h-20 w-20 items-center justify-center rounded bg-gray-100 text-gray-400">
        <span className="text-[10px]">Loading...</span>
      </div>
    );
  }

  if (file.key.startsWith("image-") || file.key.startsWith("image/")) {
    return (
      <img
        src={src}
        alt="Thumbnail preview"
        className="h-20 w-20 rounded border border-gray-200 object-cover"
      />
    );
  }

  return (
    <div className="flex h-20 w-20 flex-col items-center justify-center rounded border border-blue-200 bg-blue-50 text-blue-500">
      <Paperclip size={20} />
      <span className="mt-1 max-w-[70px] truncate px-1 text-[9px]">
        {file.name}
      </span>
    </div>
  );
};

export default function AdvancedTextbox({
  questions,
  qIndex,
  origin,
  placeholder,
  oIndex,
  setQuestions,
  setUnsavedChanges,
}: Props) {
  const questionInstance = questions[qIndex];
  const [currentText, setCurrentText] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<QuestionFile[]>([]);
  const [uploadStatuses, setUploadStatuses] = useState<
    Record<
      string,
      { status: "uploading" | "success" | "error"; error?: string }
    >
  >({});

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when loaded
  useEffect(() => {
    const nextText =
      origin === "option" && oIndex !== undefined
        ? (questionInstance!.options[oIndex]?.value?.value ?? "")
        : origin === "question" ||
            origin === "explanation" ||
            origin === "content"
          ? (questionInstance![origin]?.value ?? "")
          : "";

    const nextFiles =
      origin === "option" && oIndex !== undefined
        ? (questionInstance!.options[oIndex]?.value?.files ?? [])
        : origin === "question" ||
            origin === "explanation" ||
            origin === "content"
          ? (questionInstance![origin]?.files ?? [])
          : [];

    if (currentText !== nextText) {
      setCurrentText(nextText);
    }

    if (!areFilesEqual(uploadedFiles, nextFiles)) {
      setUploadedFiles(nextFiles);
    }
  }, [questionInstance, oIndex, origin]);

  // Handle keys logic
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const key = e.key;

    if (
      key === "ArrowUp" ||
      key === "ArrowDown" ||
      key === "ArrowLeft" ||
      key === "ArrowRight" ||
      key === "Backspace" ||
      key === "Enter"
    ) {
      e.stopPropagation();
    }

    if (key === "Enter") {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursorPosition = textarea.selectionStart;
      const textBeforeCursor = currentText.substring(0, cursorPosition);
      const textAfterCursor = currentText.substring(textarea.selectionEnd);

      const lastNewLineIndex = textBeforeCursor.lastIndexOf("\n");
      const currentLine = textBeforeCursor.substring(lastNewLineIndex + 1);

      const match = currentLine.match(/^\s*/);
      const leadingWhitespace = match ? match[0] : "";

      if (leadingWhitespace) {
        e.preventDefault();
        const newText =
          textBeforeCursor + "\n" + leadingWhitespace + textAfterCursor;
        updateQuestionText(newText);

        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart =
              textareaRef.current.selectionEnd =
                cursorPosition + 1 + leadingWhitespace.length;
          }
        }, 0);
      }
    }

    if (key === "Backspace") {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursorPosition = textarea.selectionStart;
      if (cursorPosition === textarea.selectionEnd && cursorPosition > 0) {
        const textBeforeCursor = currentText.substring(0, cursorPosition);
        const lastNewLineIndex = textBeforeCursor.lastIndexOf("\n");
        const currentLine = textBeforeCursor.substring(lastNewLineIndex + 1);

        if (currentLine.length > 0 && /^\s+$/.test(currentLine)) {
          e.preventDefault();

          const spacesToDelete = currentLine.length % 2 !== 0 ? 1 : 2;

          const newText =
            currentText.substring(0, cursorPosition - spacesToDelete) +
            currentText.substring(cursorPosition);

          updateQuestionText(newText);

          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart =
                textareaRef.current.selectionEnd =
                  cursorPosition - spacesToDelete;
            }
          }, 0);
        }
      }
    }

    if (key === "Tab") {
      e.stopPropagation();
      e.preventDefault();

      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const indent = "  ";
      const newText =
        currentText.substring(0, start) + indent + currentText.substring(end);

      updateQuestionText(newText);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart =
            textareaRef.current.selectionEnd = start + indent.length;
        }
      }, 0);
    }
  };

  const updateQuestionsWithFiles = (newFiles: QuestionFile[]) => {
    setUnsavedChanges?.(true);
    const updatedQuestions = [...questions];
    const updatedQuestion = { ...questionInstance! };

    if (
      origin === "question" ||
      origin === "explanation" ||
      origin === "content"
    ) {
      updatedQuestion[origin] = {
        ...updatedQuestion[origin],
        files: newFiles,
      };
    } else if (origin === "option" && oIndex !== undefined) {
      updatedQuestion.options = [
        ...updatedQuestion.options.slice(0, oIndex),
        {
          value: {
            ...updatedQuestion.options[oIndex]!.value,
            files: newFiles,
          },
          id: updatedQuestion.options[oIndex]!.id,
        },
        ...updatedQuestion.options.slice(oIndex + 1),
      ];
    }

    updatedQuestions[qIndex] = updatedQuestion;
    setQuestions(updatedQuestions);
  };

  const updateQuestionText = (newText: string) => {
    setUnsavedChanges?.(true);
    setCurrentText(newText);
    const updatedQuestions = [...questions];
    if (
      origin === "question" ||
      origin === "explanation" ||
      origin === "content"
    ) {
      const updatedQuestion: QuestionFormat = {
        ...questionInstance!,
        [origin]: {
          ...questionInstance![origin],
          value: newText,
          files: questionInstance?.[origin]?.files ?? [],
        },
      };
      updatedQuestions[qIndex] = updatedQuestion;
    } else if (origin === "option" && oIndex !== undefined) {
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

    setQuestions(updatedQuestions);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateQuestionText(e.target.value);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Immediate upload to Firebase Storage
  const uploadSingleFile = async (fileKey: string, file: File) => {
    setUploadStatuses((prev) => ({
      ...prev,
      [fileKey]: { status: "uploading" },
    }));

    try {
      const storage = getStorage();
      const storageRef = ref(storage, fileKey);
      const contentType = resolveUploadContentType(file);
      const snapshot = await uploadBytes(
        storageRef,
        file,
        contentType ? { contentType } : undefined,
      );
      const downloadURL = await getDownloadURL(snapshot.ref);

      setUploadStatuses((prev) => ({
        ...prev,
        [fileKey]: { status: "success" },
      }));

      // Update the file URL in the state and questions
      setUploadedFiles((prevFiles) => {
        const updated = prevFiles.map((f) =>
          f.key === fileKey ? { ...f, url: downloadURL } : f,
        );
        updateQuestionsWithFiles(updated);
        return updated;
      });
    } catch (err) {
      console.error(`Failed to upload file ${file.name}:`, err);
      setUploadStatuses((prev) => ({
        ...prev,
        [fileKey]: {
          status: "error",
          error: err instanceof Error ? err.message : "Upload failed",
        },
      }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files ?? [];
    let files = Array.from(fileList).filter(
      (file) =>
        file.type.startsWith("image/") ||
        file.type.startsWith("audio/") ||
        isSvgFileName(file.name),
    );

    const validFiles = files.filter((file) => file.size <= 5 * 1024 * 1024);
    if (validFiles.length < files.length) {
      alert("Some files ignored. Please ensure file sizes are under 5MB.");
      files = validFiles;
    }

    if (files.length === 0) {
      alert(
        "No valid file selected (photo or audio). Try uploading again or contact support.",
      );
      return;
    }

    const newFiles: QuestionFile[] = [];
    const filesToUpload: { key: string; file: File }[] = [];

    files.forEach((file) => {
      // Resolve the MIME type (some SVGs report an empty file.type) and build a
      // storage-safe key. Stripping non-alphanumerics also removes the "+" in
      // image/svg+xml, while keeping the leading "image-" prefix the renderer
      // uses to treat the file as an image.
      const mimeType =
        file.type || (isSvgFileName(file.name) ? "image/svg+xml" : "");
      const sanitizedType = mimeType.replace(/[^a-z0-9]+/gi, "-");
      const fileKey = `${sanitizedType}-${Date.now()}-${file.name}`;

      storeFileInIndexedDB(fileKey, file);

      newFiles.push({
        key: fileKey,
        name: file.name,
        order: uploadedFiles.length + newFiles.length,
      });

      filesToUpload.push({ key: fileKey, file });
    });

    const nextFiles = [...uploadedFiles, ...newFiles];
    setUploadedFiles(nextFiles);
    updateQuestionsWithFiles(nextFiles);

    e.target.value = "";

    // Trigger immediate uploads
    filesToUpload.forEach(({ key, file }) => {
      void uploadSingleFile(key, file);
    });
  };

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
      if (isStorageObjectNotFoundError(error)) {
        return;
      }

      console.error(`Error deleting file ${fileKey} from storage:`, error);
      return;
    }
  }

  const handleDeleteFile = (fileKey: string) => {
    const nextFiles = uploadedFiles.filter((file) => file.key !== fileKey);
    setUploadedFiles(nextFiles);
    updateQuestionsWithFiles(nextFiles);

    setUploadStatuses((prev) => {
      const next = { ...prev };
      delete next[fileKey];
      return next;
    });

    void deleteFileFromIndexedDB(fileKey);
    void deleteFileFromStorage(fileKey);
  };

  const handleRetryUpload = async (fileKey: string, fileName: string) => {
    try {
      const stored = await getFileFromIndexedDB(fileKey);
      if (stored?.file) {
        void uploadSingleFile(fileKey, stored.file);
      } else {
        alert(
          `Could not find local file data for "${fileName}". Please remove and re-upload.`,
        );
      }
    } catch (err) {
      console.error("Retry load from IndexedDB failed:", err);
      alert("Failed to retry. Please try uploading the file again.");
    }
  };

  const updateFileAlt = (fileKey: string, newAlt: string) => {
    const updated = uploadedFiles.map((f) =>
      f.key === fileKey ? { ...f, alt: newAlt } : f,
    );
    setUploadedFiles(updated);
    updateQuestionsWithFiles(updated);
  };

  const moveFile = (index: number, direction: "left" | "right") => {
    const targetIndex = index + (direction === "left" ? -1 : 1);
    if (targetIndex < 0 || targetIndex >= uploadedFiles.length) return;

    const nextFiles = [...uploadedFiles];
    const temp = nextFiles[index]!;
    nextFiles[index] = nextFiles[targetIndex]!;
    nextFiles[targetIndex] = temp;

    const orderedFiles = nextFiles.map((f, idx) => ({ ...f, order: idx }));
    setUploadedFiles(orderedFiles);
    updateQuestionsWithFiles(orderedFiles);
  };

  const insertPlaceholder = (file: QuestionFile, index: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const placeholderText = `[image:${index + 1}]`;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newText =
      currentText.substring(0, start) +
      placeholderText +
      currentText.substring(end);

    updateQuestionText(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + placeholderText.length,
        start + placeholderText.length,
      );
    }, 0);
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
          "Type or drag and drop here. Latex syntax starts with $@ and ends with $ (eg: $@e^{ipi} + 1 = 0$). Code blocks use ``` around the code. References to images can be made via [image:1] placeholders."
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

      {/* Grid of uploaded file cards with visual preview, load states, and alt tag fields */}
      {uploadedFiles.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {uploadedFiles.map((file, index) => {
            const statusInfo = uploadStatuses[file.key] ?? {
              status: file.url ? "success" : "uploading",
            };
            return (
              <div
                key={file.key}
                className="flex flex-col rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all duration-200 hover:shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <ThumbnailPreview file={file} />
                    {statusInfo.status === "uploading" && (
                      <div className="absolute inset-0 flex items-center justify-center rounded bg-black/40">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-xs font-semibold text-gray-800"
                      title={file.name}
                    >
                      {file.name}
                    </div>

                    {statusInfo.status === "error" && (
                      <div className="mt-1 flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-red-500">
                          Upload failed: {statusInfo.error ?? "Unknown error"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRetryUpload(file.key, file.name)}
                          className="w-fit text-[10px] font-medium text-blue-600 hover:underline"
                        >
                          Retry Upload
                        </button>
                      </div>
                    )}

                    {statusInfo.status === "success" && (
                      <span className="mt-1 inline-flex items-center rounded border border-green-200 bg-green-50 px-1.5 py-0.5 text-[9px] font-medium text-green-700">
                        Uploaded
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteFile(file.key)}
                    className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-500"
                    title="Remove file"
                  >
                    <Trash size={14} />
                  </button>
                </div>

                <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-2">
                  <div className="flex items-center gap-1.5">
                    <label
                      htmlFor={`alt-${file.key}`}
                      className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-gray-500"
                    >
                      Alt:
                    </label>
                    <input
                      id={`alt-${file.key}`}
                      type="text"
                      placeholder="Alt text (e.g. Graph of sales)"
                      value={file.alt ?? ""}
                      onChange={(e) => updateFileAlt(file.key, e.target.value)}
                      className="flex h-7 w-full rounded border border-gray-200 bg-background px-2 py-1 text-xs placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-300"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveFile(index, "left")}
                        className="rounded border border-gray-200 bg-gray-50 p-1 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-gray-50"
                        title="Move left/up"
                      >
                        <ChevronLeft size={12} />
                      </button>
                      <button
                        type="button"
                        disabled={index === uploadedFiles.length - 1}
                        onClick={() => moveFile(index, "right")}
                        className="rounded border border-gray-200 bg-gray-50 p-1 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-gray-50"
                        title="Move right/down"
                      >
                        <ChevronRight size={12} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => insertPlaceholder(file, index)}
                      className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 transition-colors hover:bg-blue-100"
                      title="Insert inline placeholder tag"
                    >
                      Insert Inline
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-2 flex justify-end">
        <button
          type="button"
          className="flex items-center gap-1 rounded-md border border-blue-500 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 shadow-sm transition-all hover:bg-blue-100 hover:text-blue-700"
          onClick={handleUploadClick}
        >
          <Paperclip size={14} /> Add file
        </button>
      </div>
    </div>
  );
}
