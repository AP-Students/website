import React, { useRef, useCallback, useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { questionInput, QuestionFormat } from "@/types/questions";

export interface Props {
  questions: QuestionFormat[];
  setQuestions: (questions: QuestionFormat[]) => void;
  qIndex: number;
}

export default function AdvancedTextbox({ questions, qIndex, setQuestions }: Props) {
  const [dragActive, setDragActive] = useState(false);
  const [currentText, setCurrentText] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Keys are being handled by EditorJS rather than default behavior, so we need to block the EditorJS behavior
    const key = e.key;
    if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Backspace') {
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
    
    const lastBlock = questions[qIndex]?.body[questions[qIndex].body.length - 1];

    if (lastBlock && lastBlock.type === "text") {
      // Set the text equal to the new block rather than appending
      lastBlock.value = newText;
    } else {
      // Add a new text block if the last block is not text or doesnt exist
      questions[qIndex]?.body.push({ type: "text", value: newText });
    }

    setQuestions([...questions]); // Update the state
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.stopPropagation(); // Stop propagation
    e.preventDefault(); // Prevent default behavior
    const file = e.dataTransfer.files[0]; 
    
    if (file?.type.startsWith("image/")) {
      // Add an image block
      const newImageBlock: questionInput = { type: "image", value: file };
      questions[qIndex]?.body.push(newImageBlock);
      console.log("Questions:", questions);
    } else if (file?.type.startsWith("audio/")) {
      // Add an audio block
      const newAudioBlock: questionInput = { type: "audio", value: file };
      questions[qIndex]?.body.push(newAudioBlock);
    }

    setDragActive(false);
    setQuestions(questions); // Update the state
    setCurrentText(""); // Reset the current text input after adding image/audio
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
        placeholder="Type or drag and drop here...latex syntax starts and ends with $$ (eg: $$e^{i\pi} + 1 = 0$$)"
      />
      {dragActive && (
        <div
          className="h-full w-full absolute inset-0 rounded-lg border-2 border-dashed border-primary bg-primary/10"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleFileDrop}
        />
      )}
    </div>
  );
}
