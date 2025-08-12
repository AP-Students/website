import React, { useState, useEffect } from "react";
import katex from "katex";
import type { QuestionFile, QuestionInput } from "@/types/questions";
import "@/styles/katexStyling.css";
import Image from "next/image";
import { decodeEntities, katexMacros } from "../Renderer";

interface Props {
  content: QuestionInput;
}

interface FileWrapper {
  file: File;
}

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

  if (file.key.startsWith("image/")) {
    return (
      <div className="my-2">
        <Image
          src={objectUrl}
          alt="Uploaded image"
          width={16}
          height={9}
          layout="responsive"
          className="h-auto max-w-full"
        />
      </div>
    );
  }

  if (file.key.startsWith("audio/")) {
    return (
      <div className="my-2">
        <audio controls>
          <source src={objectUrl} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      </div>
    );
  }

  return null;
};

export function RenderContent({ content }: Props) {
  return (
    <div className="custom-katex my-2 whitespace-pre-wrap">
      {/* Render text content directly */}
      {decodeEntities(content.value)
        .split(/(\$@[^$]+\$)/g)
        .map((line, lineIndex) => {
          if (line.endsWith("$")) {
            return (
              <span
                key={`latex-${lineIndex}`}
                dangerouslySetInnerHTML={{
                  __html: katex.renderToString(line.slice(2, -1), {
                    throwOnError: false,
                    macros: katexMacros,
                  }),
                }}
              ></span>
            );
          }
          return <span key={`text-${lineIndex}`}>{line}</span>;
        })}

      {/* Render files through individual components */}
      {content.files?.map((file) => (
        <FileRenderer key={file.key} file={file} />
      ))}
    </div>
  );
}
