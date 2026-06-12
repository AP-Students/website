"use client";
import React, { useId, useState } from "react";
import { RotateCw } from "lucide-react";
import type { QuestionFormat } from "@/types/questions";
import { RenderContent } from "@/components/article-creator/custom_questions/RenderAdvancedTextbox";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  questionInstance: QuestionFormat;
}

const CheckForUnderstanding: React.FC<Props> = ({ questionInstance }) => {
  const isFrq = questionInstance.type === "frq";
  const frqId = useId();
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [frqAnswer, setFrqAnswer] = useState<string>("");
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
      setSelectedOptions([...selectedOptions, id]);
    }
  };

  const handleSubmit = () => {
    // FRQ is self-assessed: submitting (even blank) just reveals the sample answer.
    if (isFrq) {
      setSubmitted(true);
      return;
    }
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
    setFrqAnswer("");
    setIsCorrect(null);
  };

  return (
    <div className="max-w-6xl rounded-lg border border-primary bg-primary-foreground p-4">
      <div className="markdown text-xl text-foreground">
        <RenderContent content={questionInstance.question} origin="question" />
      </div>

      {isFrq ? (
        <div className="mt-4">
          <label htmlFor={frqId} className="sr-only">
            Your answer
          </label>
          <Textarea
            id={frqId}
            value={frqAnswer}
            onChange={(e) => setFrqAnswer(e.target.value)}
            disabled={submitted}
            placeholder="Type your answer here, or leave blank and submit to see the sample answer..."
            className="min-h-32 bg-white"
          />
        </div>
      ) : (
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
      )}

      {!submitted ? (
        <button
          className="mx-auto mt-4 block rounded-md border border-blue-800 bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          onClick={handleSubmit}
        >
          Submit
        </button>
      ) : (
        <>
          {isFrq && (
            <div className="mt-4 rounded-md border border-primary bg-white p-3">
              <strong>Sample answer:</strong>
              {questionInstance.explanation.value ? (
                <RenderContent content={questionInstance.explanation} />
              ) : (
                <p className="mt-1 italic text-gray-500">
                  No sample answer was provided for this question.
                </p>
              )}
            </div>
          )}
          {!isFrq && questionInstance.explanation.value && (
            <div className="mt-4 rounded-md border border-primary bg-white p-3">
              <strong>Explanation:</strong>
              <RenderContent content={questionInstance.explanation} origin="explanation" />
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
