"use client";

import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuestionFormat } from "@/types/questions";
import { usePathname } from "next/navigation";

interface FooterProps {
  goToQuestion: (index: number) => void;
  currentQuestionIndex: number;
  questions: QuestionFormat[];
  selectedAnswers: Record<number, string[]>;
  setShowReviewPage: (showReviewPage: boolean) => void;
  submitted: boolean;
}

export function isQuestionCorrect(
  question: QuestionFormat,
  selected: string[],
) {
  const toCanonicalOptionId = (value: string) => {
    const trimmedValue = value.trim();

    const directOption = question.options.find(
      (option) => option.id === trimmedValue,
    );
    if (directOption) return directOption.id;

    const parsed = Number.parseInt(trimmedValue, 10);
    const leftover = trimmedValue.slice(String(parsed).length);

    // parseInt("1abc", 10) returns 1; ensure the whole token is numeric (e.g. "1" or " 01 ").
    if (
      Number.isInteger(parsed) &&
      leftover.trim() === "" &&
      question.options[parsed - 1]
    ) {
      return question.options[parsed - 1].id;
    }

    return trimmedValue;
  };

  const normalizedSelected = new Set(selected.map(toCanonicalOptionId));
  const normalizedAnswers = new Set(
    question.answers.map((answer) => toCanonicalOptionId(answer)),
  );

  if (question.type === "mcq") {
    for (const answer of normalizedAnswers) {
      if (normalizedSelected.has(answer)) return true;
    }

    return false;
  }

  if (normalizedSelected.size !== normalizedAnswers.size) return false;

  for (const answer of normalizedAnswers) {
    if (!normalizedSelected.has(answer)) return false;
  }

  return true;
}

export default function QuestionNavigation({
  goToQuestion,
  questions,
  selectedAnswers,
  setShowReviewPage,
  submitted,
}: FooterProps) {
  const pathname = usePathname();

  return (
    <>
      <div className="relative p-6">
        <h2 className="mb-6 text-center text-xl font-semibold uppercase">
          {pathname.split("/")[2]?.replaceAll("-", " ")} Test
        </h2>

        <div className="mb-6 flex justify-center gap-8 border-b border-t py-4">
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

            return (
              <button
                key={i}
                onClick={() => {
                  goToQuestion(i);
                  setShowReviewPage(false);
                }}
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center text-lg font-medium",
                  !submitted && isAnswered
                    ? "bg-[#2a47bb] text-white"
                    : "border-2 border-dashed border-gray-400 text-[#2a47bb]",
                  submitted &&
                    (isQuestionCorrect(question, selectedAnswers[i] ?? [])
                      ? "border-none bg-green-500 text-white"
                      : "border-none bg-red-600 text-white"),
                )}
              >
                {i + 1}
                {question.bookmarked && (
                  <Bookmark className="absolute -right-3 -top-2 size-6 fill-red-500 text-red-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
