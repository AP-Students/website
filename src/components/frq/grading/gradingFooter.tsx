"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import FRQDropdown from "@/components/frq/FRQDropdown";
import type { FRQDropdownPart } from "@/components/frq/FRQDropdown";

type GradingFooterProps = {
  testName: string;
  studentId: string;
  currentQuestionIndex: number;
  questionCount: number;
  /** Index-aligned with the question grid, so every part is one click away. */
  questionParts: FRQDropdownPart[][];
  onPrevious: () => void;
  onNext: () => void;
  onJumpToQuestion: (index: number) => void;
  onJumpToPart: (partId: string) => void;
};

/**
 * The grading page's own footer. It shares `FRQDropdown` with the test and
 * feedback pages so the question grid stays one implementation, but keeps the
 * chevrons and the student id, which belong to grading alone.
 */
const GradingFooter = ({
  testName,
  studentId,
  currentQuestionIndex,
  questionCount,
  questionParts,
  onPrevious,
  onNext,
  onJumpToQuestion,
  onJumpToPart,
}: GradingFooterProps) => (
  <footer className="fixed bottom-0 left-0 z-50 flex h-14 w-full items-center justify-between border-t-2 border-gray-300 bg-white px-8">
    <p className="font-semibold">{testName}</p>

    <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
      <button
        type="button"
        aria-label="Previous question"
        disabled={currentQuestionIndex === 0}
        onClick={onPrevious}
        className="rounded-md bg-black p-2 text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft aria-hidden="true" className="size-5" />
      </button>

      <FRQDropdown
        testName={testName}
        currentFrqIndex={currentQuestionIndex}
        totalFrqs={questionCount}
        onJumpToFrq={onJumpToQuestion}
        questionParts={questionParts}
        onJumpToPart={onJumpToPart}
      />

      <button
        type="button"
        aria-label="Next question"
        disabled={currentQuestionIndex === questionCount - 1}
        onClick={onNext}
        className="rounded-md bg-black p-2 text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight aria-hidden="true" className="size-5" />
      </button>
    </div>

    <p className="text-sm text-gray-600">
      Student: <span className="font-mono">{studentId}</span>
    </p>
  </footer>
);

export default GradingFooter;
