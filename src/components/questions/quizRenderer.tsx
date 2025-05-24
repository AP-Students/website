"use client";
import React, { useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import type { QuestionFormat } from "@/types/questions";
import { RenderContent } from "@/components/article-creator/custom_questions/RenderAdvancedTextbox";

interface QuizRendererProps {
  questions: QuestionFormat[];
}

type Answers = Record<number, string[]>;

const QuizRenderer: React.FC<QuizRendererProps> = ({ questions }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [showResults, setShowResults] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);

  const questionInstance = questions[currentQuestionIndex]!;

  const handleSelectOption = (optionId: string): void => {
    setAnswers({
      ...answers,
      [currentQuestionIndex]:
        questionInstance.type === "mcq" ? [optionId] : toggleAnswer(optionId),
    });
  };

  const toggleAnswer = (optionId: string): string[] => {
    const currentAnswers = answers[currentQuestionIndex] ?? [];
    return currentAnswers.includes(optionId)
      ? currentAnswers.filter((id) => id !== optionId)
      : [...currentAnswers, optionId];
  };

  const navigateQuestions = (direction: number): void => {
    setCurrentQuestionIndex((prevIndex) => {
      const newIndex = prevIndex + direction;
      return newIndex >= 0 && newIndex < questions.length
        ? newIndex
        : prevIndex;
    });
  };

  const handleSubmitTest = (): void => {
    const correctCount = Object.keys(answers).reduce((acc, key) => {
      const index = parseInt(key);
      const questionAnswers = questions[index]?.answers ?? [];
      const userAnswers = answers[index] ?? [];
      const isCorrect =
        questionAnswers.length === userAnswers.length &&
        questionAnswers.every((id) => userAnswers.includes(id));
      return acc + (isCorrect ? 1 : 0);
    }, 0);
    setScore(correctCount);
    setShowResults(true);
    setCurrentQuestionIndex(0);
  };

  const isAnswerCorrect = (optionId: string): boolean => {
    return questionInstance.answers.includes(optionId);
  };

  return (
    <div className="max-w-6xl rounded-lg border border-primary bg-primary-foreground p-4 md:p-6 lg:p-8">
      <div className="inline-block rounded-2xl bg-primary px-2.5 py-0.5 text-lg font-medium tabular-nums text-zinc-50">
        {!showResults && `${currentQuestionIndex + 1}/${questions.length}`}
        {showResults &&
          `Score: ${score}/${questions.length} (${((score / questions.length) * 100).toFixed(2)}%)`}
      </div>
      <div className="markdown text-xl text-foreground">
        <RenderContent content={questionInstance.question} />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4">
        {questionInstance.options.map((option) => (
          <button
            key={option.id}
            className={`rounded-md border px-2 text-left shadow transition-colors
            ${
              showResults
                ? isAnswerCorrect(option.id)
                  ? answers[currentQuestionIndex]?.includes(option.id)
                    ? "border-green-700 bg-green-300"
                    : "border-green-700 bg-green-100"
                  : answers[currentQuestionIndex]?.includes(option.id)
                    ? "border-red-700 bg-red-300"
                    : "border-gray-300 bg-white"
                : answers[currentQuestionIndex]?.includes(option.id)
                  ? "border-blue-500 bg-blue-100"
                  : "border-gray-300 bg-white"
            }
            `}
            onClick={() => handleSelectOption(option.id)}
            disabled={showResults}
          >
            <RenderContent content={option.value} />
          </button>
        ))}
      </div>

      {showResults && questionInstance.explanation && (
        <div className="mt-4 rounded-md border border-primary bg-white p-3">
          <strong>Explanation:</strong>
          <RenderContent content={questionInstance.explanation} />
        </div>
      )}

      <div className="relative mt-4 flex justify-between">
        {currentQuestionIndex > 0 && (
          <button
            className="flex items-center rounded-md border border-gray-800 bg-gray-500 py-2 pl-2 pr-4 text-white transition-colors hover:bg-gray-600"
            onClick={() => navigateQuestions(-1)}
          >
            <ChevronLeft size={24} />
            <span>Previous</span>
          </button>
        )}
        {currentQuestionIndex < questions.length - 1 && (
          <button
            className="ml-auto flex items-center rounded-md border border-gray-800 bg-gray-500 py-2 pl-4 pr-2 text-white transition-colors hover:bg-gray-600"
            onClick={() => navigateQuestions(1)}
          >
            <span>Next</span>
            <ChevronRight size={24} />
          </button>
        )}
        {!showResults && currentQuestionIndex === questions.length - 1 && (
          <button
            className="absolute left-1/2 -translate-x-1/2 rounded-md border border-blue-800 bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            onClick={handleSubmitTest}
          >
            Submit
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizRenderer;
