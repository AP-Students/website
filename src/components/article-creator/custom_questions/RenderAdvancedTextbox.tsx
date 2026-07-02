import React, { useState, useEffect } from "react";
import katex from "katex";
import type { QuestionFile, QuestionInput } from "@/types/questions";
import "../../../styles/katexStyling.css";
import { decodeEntities, katexMacros } from "../Renderer";

import { cn, isSvgFileName } from "@/lib/utils";

interface Props {
  content: QuestionInput;
  origin?: "question" | "explanation" | "option" | "content";
}

interface FileWrapper {
  file: File;
}

const isImageFileKey = (key: string) =>
  key.startsWith("image/") || key.startsWith("image-");

const isAudioFileKey = (key: string) =>
  key.startsWith("audio/") || key.startsWith("audio-");

// Utility to retrieve a file from IndexedDB based on unique ID
export function getFileFromIndexedDB(
  name: string,
): Promise<FileWrapper | null> {
  return new Promise((resolve) => {
    const dbRequest = indexedDB.open("mediaFilesDB", 3);

    dbRequest.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create the object store if it doesn't exist
      if (!db.objectStoreNames.contains("mediaFiles")) {
        db.createObjectStore("mediaFiles", { keyPath: "id" });
      }
    };

    dbRequest.onsuccess = () => {
      const db = dbRequest.result;

      const transaction = db.transaction("mediaFiles", "readonly");
      const objectStore = transaction.objectStore("mediaFiles");

      // Use the same unique ID to retrieve the file
      const uniqueId = `file_${name}`;

      const fileRequest = objectStore.get(uniqueId); // Fetch file by its unique ID

      fileRequest.onsuccess = () => {
        const fileBlob = fileRequest.result as
          | FileWrapper
          | Promise<FileWrapper | null>
          | null;
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

const FileRenderer: React.FC<{ file: QuestionFile }> = ({ file }) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;

    const fetchFile = async () => {
      if (file.url) {
        setObjectUrl(file.url);
        return;
      }

      try {
        const storedFile = await getFileFromIndexedDB(file.key);
        if (storedFile?.file) {
          const blob = storedFile.file;
          url = URL.createObjectURL(blob);
          setObjectUrl(url);
        }
      } catch (error) {
        console.error("Error loading file:", error);
      }
    };

    void fetchFile();

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [file]);

  if (!objectUrl) return null;

  if (isImageFileKey(file.key)) {
    // SVGs frequently omit intrinsic dimensions (viewBox only), which makes them
    // collapse or overflow under width/height auto. Give them a definite,
    // responsive width instead.
    const isSvg = isSvgFileName(file.name) || file.key.startsWith("image-svg");
    return (
      <div className="my-2 flex w-full justify-center">
        <img
          src={objectUrl}
          alt={file.alt ?? "Uploaded image"}
          loading="lazy"
          className={cn(
            "rounded-md object-contain shadow-sm transition-shadow duration-200 hover:shadow-md",
            isSvg
              ? "h-auto w-full max-w-[450px]"
              : "h-auto max-h-[450px] w-auto max-w-full",
          )}
        />
      </div>
    );
  }

  if (isAudioFileKey(file.key)) {
    return (
      <div className="my-2">
        <audio controls className="w-full max-w-md">
          <source src={objectUrl} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      </div>
    );
  }

  return null;
};

export function RenderContent({ content, origin }: Props) {
  // Sort files by their order index, default to stable positioning
  const sortedFiles = [...(content.files || [])].sort((a, b) => {
    const orderA = a.order ?? 999;
    const orderB = b.order ?? 999;
    return orderA - orderB;
  });

  const renderedInlineKeys = new Set<string>();

  // Function to search for a matching file based on placeholder string
  const getMatchingFile = (param: string) => {
    const trimmed = param.trim();
    // 1. Check if 1-based index (e.g., [image:1])
    const index = parseInt(trimmed, 10);
    if (!isNaN(index) && index > 0 && index <= sortedFiles.length) {
      return sortedFiles[index - 1];
    }
    // 2. Check if direct file key matches
    const byKey = sortedFiles.find((f) => f.key === trimmed);
    if (byKey) return byKey;
    // 3. Check if filename matches (case-insensitive)
    const byName = sortedFiles.find(
      (f) =>
        f.name.toLowerCase() === trimmed.toLowerCase() ||
        f.name.split(".")[0]?.toLowerCase() === trimmed.toLowerCase(),
    );
    if (byName) return byName;
    return null;
  };

  const tokens = decodeEntities(content.value)
    .split(/(```[\s\S]*?```|\$@[^$]+\$|\[image:[^\]]+\])/g)
    .map((token, tokenIndex) => {
      if (token.startsWith("```") && token.endsWith("```")) {
        const codeContent = token.slice(3, -3).replace(/^\n/, "");
        return (
          <pre
            key={`code-${tokenIndex}`}
            className="my-2 max-w-full overflow-x-auto whitespace-pre-wrap rounded p-2 font-mono text-sm leading-relaxed text-black"
            style={{
              fontFamily: "'Consolas', monospace",
              backgroundColor: "#f0f0f0",
            }}
          >
            <code>{codeContent}</code>
          </pre>
        );
      } else if (token.startsWith("$@") && token.endsWith("$")) {
        return (
          <span
            key={`latex-${tokenIndex}`}
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(token.slice(2, -1), {
                throwOnError: false,
                macros: katexMacros,
              }),
            }}
          ></span>
        );
      } else if (token.startsWith("[image:") && token.endsWith("]")) {
        const param = token.slice(7, -1);
        const matchedFile = getMatchingFile(param);
        if (matchedFile) {
          renderedInlineKeys.add(matchedFile.key);
          return (
            <div
              key={`inline-img-${tokenIndex}`}
              className="my-4 block text-center"
            >
              <FileRenderer file={matchedFile} />
              {matchedFile.alt && (
                <span className="mt-1 block text-center text-xs italic text-gray-500">
                  {matchedFile.alt}
                </span>
              )}
            </div>
          );
        }
      }
      return <span key={`text-${tokenIndex}`}>{token}</span>;
    });

  // Filter out files that were already rendered inline
  const remainingFiles = sortedFiles.filter(
    (file) => !renderedInlineKeys.has(file.key),
  );
  const remainingImages = remainingFiles.filter((file) =>
    isImageFileKey(file.key),
  );
  const remainingAudio = remainingFiles.filter((file) =>
    isAudioFileKey(file.key),
  );

  return (
    <div className="custom-katex my-2 whitespace-pre-wrap">
      {/* Render parsed inline block elements */}
      {tokens}

      {/* Render any leftover audio files */}
      {remainingAudio.map((file) => (
        <FileRenderer key={file.key} file={file} />
      ))}

      {/* Render remaining images */}
      {remainingImages.length > 0 && (
        <div className="mt-4">
          {origin === "question" && remainingImages.length >= 2 ? (
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
              {remainingImages.map((file, idx) => {
                const isThirdOfThree =
                  remainingImages.length === 3 && idx === 2;
                return (
                  <div
                    key={file.key}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50/40 p-2 shadow-sm",
                      isThirdOfThree &&
                        "w-full sm:col-span-2 sm:mx-auto sm:max-w-2xl",
                    )}
                  >
                    <FileRenderer file={file} />
                    {file.alt && (
                      <span className="mt-1 block text-center text-xs italic text-gray-500">
                        {file.alt}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {remainingImages.map((file) => (
                <div key={file.key} className="flex flex-col items-center">
                  <FileRenderer file={file} />
                  {file.alt && (
                    <span className="mt-1 block text-center text-xs italic text-gray-500">
                      {file.alt}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
