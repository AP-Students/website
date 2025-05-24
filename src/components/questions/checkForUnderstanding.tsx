"use client";
import React, { useState } from "react";
import { RotateCw } from "lucide-react";
import type { QuestionFormat } from "@/types/questions";
import { RenderContent } from "@/components/article-creator/custom_questions/RenderAdvancedTextbox";
import { cn } from "@/lib/utils";

interface Props {
  questionInstance: QuestionFormat;
}

const CheckForUnderstanding: React.FC<Props> = ({ questionInstance }) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSelectOption = (id: string) => {
    const numAnswers = questionInstance.answers.length;
    if (!submitted) {
      if (numAnswers === 1) {
        setSelectedOptions([id]);
        return;
      }
      if (selectedOptions.includes(id)) {
        setSelectedOptions(selectedOptions.filter((oid) => oid !== id));
        return;
      }
    }
  };

  const handleSubmit = () => {
    if (selectedOptions.length > 0) {
      setSubmitted(true);
      const allCorrect =
        questionInstance.answers.length === selectedOptions.length &&
        questionInstance.answers.every((id) => selectedOptions.includes(id));
      setIsCorrect(allCorrect);
    }
  };

  const isAnswerCorrect = (id: string) => {
    return questionInstance.answers.includes(id);
  };

  const handleRetry = () => {
    setSubmitted(false);
    setSelectedOptions([]);
    setIsCorrect(null);
  };

  return (
    <div className="max-w-6xl rounded-lg border border-primary bg-primary-foreground p-4">
      <div className="markdown text-xl text-foreground">
        <RenderContent content={questionInstance.question} />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4">
        {questionInstance.options.map((option) => (
          <button
            key={option.id}
            className={cn(
              "rounded-md border bg-white px-2 text-left shadow transition-colors",
              submitted
                ? isAnswerCorrect(option.id)
                  ? selectedOptions.includes(option.id)
                    ? "border-green-700 bg-green-300"
                    : "border-green-700 bg-green-100"
                  : selectedOptions.includes(option.id)
                    ? "border-red-700 bg-red-300"
                    : "border-gray-300"
                : selectedOptions.includes(option.id)
                  ? "border-blue-500 bg-blue-100"
                  : "border-gray-300",
            )}
            onClick={() => handleSelectOption(option.id)}
            disabled={submitted}
          >
            <RenderContent content={option.value} />
          </button>
        ))}
      </div>
      {!submitted ? (
        <button
          className="mx-auto mt-4 block rounded-md border border-blue-800 bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          onClick={handleSubmit}
        >
          Submit
        </button>
      ) : (
        <>
          {questionInstance.explanation && (
            <div className="mt-4 rounded-md border border-primary bg-white p-3">
              <strong>Explanation:</strong>
              <RenderContent content={questionInstance.explanation} />
            </div>
          )}
          <button
            className={`mx-auto mt-4 flex items-center rounded-md border border-gray-800 bg-gray-500 py-2 pl-3 pr-4 text-white transition-colors hover:bg-gray-600`}
            onClick={handleRetry}
          >
            <RotateCw size={24} className="mr-2" />
            <span>Retry</span>
          </button>
        </>
      )}
    </div>
  );
};

export default CheckForUnderstanding;
