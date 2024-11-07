"use client";

import { useState } from "react";
import { MapPin, Bookmark, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuestionFormat } from "@/types/questions";

interface FooterProps {
  goToQuestion: (index: number) => void;
  currentQuestionIndex: number;
  questions: QuestionFormat[];
  selectedAnswers: Record<number, string[]>;
}

export default function QuestionNavigation({
  goToQuestion,
  currentQuestionIndex,
  questions,
  selectedAnswers,
}: FooterProps) {

  return (
    <>
      <div className="relative p-6">
        <h2 className="mb-6 text-center text-xl font-semibold">
          {/* Should be dynamic */}
          Section 1, Module 1: Reading and Writing Questions
        </h2>

        <div className="mb-6 flex justify-center gap-8 border-b border-t py-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            <span>Current</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded border-2 border-dashed border-gray-400"></div>
            <span>Unanswered</span>
          </div>
          <div className="flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            <span>For Review</span>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-[repeat(10,minmax(0,40px))] justify-center gap-4">
          {questions.map((question, i) => {
            const isAnswered =
              selectedAnswers[i] && selectedAnswers[i].length > 0;
            const isCurrent = i === currentQuestionIndex;

            return (
              <button
                key={i}
                onClick={() => {
                  goToQuestion(i);
                }}
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center text-lg font-medium",
                  isAnswered
                    ? "bg-[#2a47bb] text-white"
                    : "border-2 border-dashed border-gray-400 text-[#2a47bb]",
                )}
              >
                {i + 1}
                {question.bookmarked && (
                  <Bookmark className="absolute -right-1 -top-2 h-4 w-4 fill-red-500 text-red-500" />
                )}
                {isCurrent && (
                  <MapPin className="absolute -right-1 -top-2 h-4 w-4 text-black" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
