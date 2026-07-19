"use client";

import { ChevronLeft, ChevronRight, ChevronUp, MapPin, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";

interface FooterProps {
  testName: string;
  currentFrqIndex: number;
  totalFrqs: number;
  onPrevious: () => void;
  onNext: () => void;
  onJumpToFrq: (index: number) => void;
}

export default function Footer({
  testName,
  currentFrqIndex,
  totalFrqs,
  onPrevious,
  onNext,
  onJumpToFrq,
}: FooterProps) {
  const [navigationOpen, setNavigationOpen] = useState(false);

  return (
    <footer className="fixed bottom-0 left-0 z-50 flex h-14 w-full items-center justify-between border-t-2 border-dashed border-gray-500 bg-white px-8">
      <p className="font-semibold">{testName}</p>

      <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
        <button
          onClick={onPrevious}
          className="rounded-md bg-black p-2 text-white"
        >
          <ChevronLeft className="size-5" />
        </button>

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
                  aria-label="Close question navigation"
                  onClick={() => setNavigationOpen(false)}
                  className="absolute right-5 top-5"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="border-t border-gray-300" />

              <div className="px-8 py-8">
                <div className="grid grid-cols-6 gap-x-5 gap-y-8">
                  {Array.from({ length: totalFrqs }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        onJumpToFrq(index);
                        setNavigationOpen(false);
                      }}
                      className="relative flex size-10 items-center justify-center border-2 border-transparent bg-[#294ad1] text-base font-bold text-white"
                    >
                      {index + 1}

                      {index === currentFrqIndex && (
                        <MapPin className="absolute -top-7 size-5 fill-white stroke-black" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <button onClick={onNext} className="rounded-md bg-black p-2 text-white">
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onPrevious}
          className="rounded-full bg-[#294ad1] px-6 py-2 font-bold text-white"
        >
          Back
        </button>

        <button
          onClick={onNext}
          className="rounded-full bg-[#294ad1] px-6 py-2 font-bold text-white"
        >
          Next
        </button>
      </div>
    </footer>
  );
}
