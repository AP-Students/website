"use client";
import React, { useState } from "react";
import { MdNavigateNext, MdNavigateBefore } from "react-icons/md";
import { QuestionFormat } from "@/types/questions";

interface QuizRendererProps {
  questions: QuestionFormat[];
}

interface Answers {
  [questionIndex: number]: string[];
}

const QuizRenderer: React.FC<QuizRendererProps> = ({ questions }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [showResults, setShowResults] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);

  const question = questions[currentQuestionIndex]!;

  const handleSelectOption = (optionId: string): void => {
    setAnswers({
      ...answers,
      [currentQuestionIndex]:
        question.type === "mcq" ? [optionId] : toggleAnswer(optionId),
    });
  };

  const toggleAnswer = (optionId: string): string[] => {
    const currentAnswers = answers[currentQuestionIndex] || [];
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
      const questionAnswers = questions[index]?.correct ?? [];
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
    return question.correct.includes(optionId);
  };

  return (
    <div className="max-w-6xl bg-primary-foreground p-4 md:p-6 lg:p-8">
      <div className="inline-block rounded-2xl bg-primary px-2.5 py-0.5 text-lg font-medium text-zinc-50">
        {!showResults && `${currentQuestionIndex + 1}/${questions.length}`}
        {showResults &&
          `Score: ${score}/${questions.length} (${((score / questions.length) * 100).toFixed(2)}%)`}
      </div>
      <div
        className="markdown text-xl font-bold md:text-2xl lg:text-3xl"
        dangerouslySetInnerHTML={{ __html: question.body }}
      />
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {question.options.map((option) => (
          <button
            key={option.id}
            className={`flex items-center justify-center rounded-lg border px-6 py-4 md:text-lg lg:text-xl
            ${
              showResults
                ? isAnswerCorrect(option.id)
                  ? answers[currentQuestionIndex]?.includes(option.id)
                    ? "border-green-700 bg-green-300"
                    : "border-green-700 bg-green-100"
                  : answers[currentQuestionIndex]?.includes(option.id)
                    ? "border-red-700 bg-red-300"
                    : "border-gray-300"
                : answers[currentQuestionIndex]?.includes(option.id)
                  ? "border-blue-500 bg-blue-100"
                  : "border-primary bg-zinc-50"
            }
            `}
            onClick={() => handleSelectOption(option.id)}
            disabled={showResults}
          >
            {option.value}
          </button>
        ))}
      </div>
      <div className="mt-4 flex justify-between">
        {currentQuestionIndex > 0 && (
          <button
            className="flex items-center rounded bg-gray-500 py-2 pl-3 pr-4 text-white hover:bg-gray-600"
            onClick={() => navigateQuestions(-1)}
          >
            <MdNavigateBefore size={24} style={{ color: "white" }} />
            <span>Previous</span>
          </button>
        )}
        {currentQuestionIndex < questions.length - 1 && (
          <button
            className="ml-auto flex items-center rounded bg-gray-500 py-2 pl-3 pr-4 text-white hover:bg-gray-600"
            onClick={() => navigateQuestions(1)}
          >
            <MdNavigateNext size={24} style={{ color: "white" }} />
            <span>Next</span>
          </button>
        )}
        {!showResults && currentQuestionIndex === questions.length - 1 && (
          <button
            className="ml-auto rounded bg-blue-500 px-6 py-2 text-white hover:bg-blue-600"
            onClick={handleSubmitTest}
          >
            Submit Test
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizRenderer;
