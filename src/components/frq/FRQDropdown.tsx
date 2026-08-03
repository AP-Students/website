"use client";

import { ChevronUp, MapPin, X } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface FRQDropdownProps {
  testName: string;
  currentFrqIndex: number;
  totalFrqs: number;
  onJumpToFrq: (index: number) => void;
  leftWidget?: ReactNode;
}

export default function FRQDropdown({
  testName,
  currentFrqIndex,
  totalFrqs,
  onJumpToFrq,
  leftWidget,
}: FRQDropdownProps) {
  const [navigationOpen, setNavigationOpen] = useState(false);

  const jumpToFrq = (index: number) => {
    onJumpToFrq(index);
    setNavigationOpen(false);
  };

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
              <h2 className="text-xl font-bold">
                {testName} Questions
              </h2>

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

            <div className="px-8 py-8">
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
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}