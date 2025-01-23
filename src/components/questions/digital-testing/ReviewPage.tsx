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
}

export default function QuestionNavigation({
  goToQuestion,
  questions,
  selectedAnswers,
  setShowReviewPage,
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
                  isAnswered
                    ? "bg-[#2a47bb] text-white"
                    : "border-2 border-dashed border-gray-400 text-[#2a47bb]",
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
