import React, { useState, useEffect, useCallback } from "react";
import katex from "katex";
import { questionInput } from "@/types/questions";
import { getFileFromIndexedDB } from "./AdvancedTextbox";

interface Props {
  content: questionInput;
}

export const RenderContent: React.FC<Props> = ({ content }) => {
  const [elements, setElements] = useState<JSX.Element[]>([]);

  // Function to handle LaTeX and text rendering
  const renderTextContent = useCallback(() => {
    const tempElements: JSX.Element[] = [];

    if (content.value) {
      content.value.split("$@").forEach((line, lineIndex) => {
        // Convert to LaTeX syntax
        if (line.startsWith("$") && line.endsWith("$")) {
          tempElements.push(
            <div key={`latex-${lineIndex}`} className="my-2">
              <div
                dangerouslySetInnerHTML={{
                  __html: katex.renderToString(line, {
                    throwOnError: false,
                  }),
                }}
              />
            </div>
          );
        } else {
          // Render regular text
          tempElements.push(<div key={`text-${lineIndex}`}>{line}</div>);
        }
      });
    }
    setElements((prev) => [...prev, ...tempElements]); // Append text content to state
  }, [content.value]);

  // Function to handle file content rendering
  const renderFileContent = useCallback(() => {
    if (content.fileKey) {
      getFileFromIndexedDB(content.fileKey).then((file) => {
        // @ts-ignore - file is an object incasing file, not the file iteself
        if (file && file.file) {
        // @ts-ignore - file is an object incasing file, not the file iteself
          const fileURL = URL.createObjectURL(file.file);

          if (content.fileKey!.startsWith("image/")) {
            setElements((prev) => [
              ...prev,
              <div key={content.fileKey} className="my-2">
                <img
                  src={fileURL}
                  alt="Uploaded image"
                  className="h-auto max-w-full"
                />
              </div>,
            ]);
          } else if (content.fileKey!.startsWith("audio/")) {
            setElements((prev) => [
              ...prev,
              <div key={content.fileKey} className="my-2">
                <audio controls>
                  <source src={fileURL} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>,
            ]);
          }

          // Revoke the object URL after the component unmounts
          return () => {
            URL.revokeObjectURL(fileURL);
          };
        }
      });
    }
  }, [content.fileKey]);

  // useEffect to trigger rendering of text and file content
  useEffect(() => {
    setElements([]); // Reset elements before rendering new content
    renderTextContent();
    renderFileContent();
  }, [renderTextContent, renderFileContent]);

  return <div>{elements}</div>; // Render the content
};
