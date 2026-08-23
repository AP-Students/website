"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import FRQDropdown from "@/components/frq/FRQDropdown";
import type { FRQDropdownPart } from "@/components/frq/FRQDropdown";

interface FooterProps {
  testName: string;
  currentFrqIndex: number;
  totalFrqs: number;
  onPrevious: () => void;
  onNext: () => void;
  onJumpToFrq: (index: number) => void;
  /**
   * Passed straight through to the dropdown so a student can reach a single
   * part. Both are optional: the feedback page navigates a list with no parts
   * and omits them, which keeps its dropdown exactly as it was.
   */
  questionParts?: FRQDropdownPart[][];
  onJumpToPart?: (partId: string) => void;
}

export default function Footer({
  testName,
  currentFrqIndex,
  totalFrqs,
  onPrevious,
  onNext,
  onJumpToFrq,
  questionParts,
  onJumpToPart,
}: FooterProps) {
  return (
    <footer className="fixed bottom-0 left-0 z-50 flex h-14 w-full items-center justify-between border-t-2 border-gray-300 bg-white px-8">
      <p className="font-semibold">{testName}</p>

      <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          className="rounded-md bg-black p-2 text-white disabled:cursor-not-allowed disabled:opacity-40"
          disabled={currentFrqIndex === 0}
          aria-label="Previous FRQ"
        >
          <ChevronLeft className="size-5" />
        </button>

        <FRQDropdown
          testName={testName}
          currentFrqIndex={currentFrqIndex}
          totalFrqs={totalFrqs}
          onJumpToFrq={onJumpToFrq}
          questionParts={questionParts}
          onJumpToPart={onJumpToPart}
        />

        <button
          type="button"
          onClick={onNext}
          className="rounded-md bg-black p-2 text-white"
          aria-label="Next FRQ"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onPrevious}
          className="rounded-full bg-[#294ad1] px-6 py-2 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          disabled={currentFrqIndex === 0}
        >
          Back
        </button>

        <button
          type="button"
          onClick={onNext}
          className="rounded-full bg-[#294ad1] px-6 py-2 font-bold text-white"
        >
          Next
        </button>
      </div>
    </footer>
  );
}