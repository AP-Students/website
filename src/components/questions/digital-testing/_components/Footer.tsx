import React from "react";
import { Bookmark, ChevronUp, MapPin } from "lucide-react";
import { Question } from "../testRenderer";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import clsx from "clsx";

interface FooterProps {
  onNext: () => void;
  onPrevious: () => void;
  goToQuestion: (index: number) => void;
  currentQuestionIndex: number;
  questions: Question[];
}

const Footer: React.FC<FooterProps> = ({
  onNext,
  onPrevious,
  goToQuestion,
  currentQuestionIndex,
  questions,
}) => {
  return (
    <footer className="fixed bottom-0 left-0 flex w-full items-center justify-between border-t-2 border-gray-300 bg-white px-4 py-2.5 text-black">
      <p>John Doe</p>
      <Popover>
        <PopoverTrigger className="flex items-center gap-1 rounded-md bg-black py-1 pl-3 pr-1 text-sm font-bold tabular-nums text-white">
          Question {currentQuestionIndex + 1} of {questions.length}
          <ChevronUp />
        </PopoverTrigger>
        <PopoverContent className="w-min">
          <div className="mb-10 flex gap-4">
            <p className="flex">
              <MapPin className="mr-1 inline" /> Current
            </p>
            <p className="flex">
              <div className="mr-1 size-6 border-2 border-dotted border-gray-400"></div>
              Unanswered
            </p>
            <p className="flex text-nowrap">
              <Bookmark className="mr-1 fill-black" /> For Review
            </p>
          </div>
          <div className="grid grid-cols-6 gap-4">
            {questions.map((question, i) => (
              <button
                className={clsx(
                  "relative flex size-8 items-center justify-center border-2",
                  {
                    "border-transparent bg-[#2a47bb] text-white":
                      question.selected !== null,
                    "border-dotted border-gray-400 text-[#2a47bb]":
                      question.selected === null,
                  },
                )}
                onClick={() => goToQuestion(i)}
                key={i}
              >
                {i + 1}
                {questions[i]?.bookmarked && (
                  <Bookmark className="absolute -top-2 left-5 size-5 fill-black stroke-white" />
                )}
                {i === currentQuestionIndex && (
                  <MapPin className="absolute -top-5 fill-white stroke-black" />
                )}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <div>
        <button
          className="mr-3 rounded-full bg-[#294ad1] px-6 py-2 font-bold text-white hover:bg-[#2a47bb]"
          onClick={onPrevious}
        >
          Back
        </button>
        <button
          className="rounded-full bg-[#294ad1] px-6 py-2 font-bold text-white hover:bg-[#2a47bb]"
          onClick={onNext}
        >
          Next
        </button>
      </div>
    </footer>
  );
};

export default Footer;
