"use client";

import { ChevronUp, MapPin, X } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/** One part shortcut inside a question's row. */
export interface FRQDropdownPart {
  id: string;
  label: string;
}

export interface FRQDropdownProps {
  testName: string;
  currentFrqIndex: number;
  totalFrqs: number;
  onJumpToFrq: (index: number) => void;
  /**
   * Parts belonging to each question, index-aligned with the question grid.
   * Optional because the feedback page navigates a list that has no parts to
   * expand, and passes neither this nor `onJumpToPart`; without both the
   * dropdown keeps its original number-only grid.
   */
  questionParts?: FRQDropdownPart[][];
  onJumpToPart?: (partId: string) => void;
  leftWidget?: ReactNode;
}

export default function FRQDropdown({
  testName,
  currentFrqIndex,
  totalFrqs,
  onJumpToFrq,
  questionParts,
  onJumpToPart,
  leftWidget,
}: FRQDropdownProps) {
  const [navigationOpen, setNavigationOpen] = useState(false);

  const jumpToFrq = (index: number) => {
    onJumpToFrq(index);
    setNavigationOpen(false);
  };

  const jumpToPart = (partId: string) => {
    onJumpToPart?.(partId);
    setNavigationOpen(false);
  };

  // A question's parts all sit on one page now, so the grid lists them beside
  // their question number to keep every individual part one click away.
  const showParts = Boolean(questionParts && onJumpToPart);

  return (
    <div className="flex items-center gap-2">
      {leftWidget}

      <Popover open={navigationOpen} onOpenChange={setNavigationOpen}>
        <PopoverTrigger className="flex items-center gap-1 rounded-md bg-black px-4 py-2 text-sm font-bold text-white">
          Question {currentFrqIndex + 1} of {totalFrqs}
          <ChevronUp className="size-4" />
        </PopoverTrigger>

        <PopoverContent className="w-[480px] p-0">
          <div className="rounded-md bg-white">
            <div className="relative px-8 py-5 text-center">
              <h2 className="text-xl font-bold">{testName} Questions</h2>

              <button
                type="button"
                className="absolute right-5 top-5"
                aria-label="Close question navigation"
                onClick={() => setNavigationOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="border-t border-gray-300" />

            <div className="max-h-[60vh] overflow-y-auto px-8 py-8">
              {showParts ? (
                <div className="space-y-6">
                  {Array.from({ length: totalFrqs }).map((_, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => jumpToFrq(index)}
                        className="relative flex size-10 shrink-0 items-center justify-center border-2 border-transparent bg-[#294ad1] text-base font-bold text-white"
                        aria-label={`Go to question ${index + 1}`}
                      >
                        {index + 1}

                        {index === currentFrqIndex && (
                          <MapPin className="absolute -top-7 size-5 fill-white stroke-black" />
                        )}
                      </button>

                      <div className="flex flex-wrap gap-2">
                        {(questionParts?.[index] ?? []).map((part) => (
                          <button
                            key={part.id}
                            type="button"
                            onClick={() => jumpToPart(part.id)}
                            className="flex size-8 items-center justify-center border border-gray-400 text-sm font-bold text-black hover:bg-gray-100"
                            aria-label={`Go to question ${index + 1}, part ${part.label}`}
                          >
                            {part.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-6 gap-x-5 gap-y-8">
                  {Array.from({ length: totalFrqs }).map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => jumpToFrq(index)}
                      className="relative flex size-10 items-center justify-center border-2 border-transparent bg-[#294ad1] text-base font-bold text-white"
                      aria-label={`Go to FRQ ${index + 1}`}
                    >
                      {index + 1}

                      {index === currentFrqIndex && (
                        <MapPin className="absolute -top-7 size-5 fill-white stroke-black" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
