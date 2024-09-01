import React from "react";
import { ChevronUp } from "lucide-react";

interface FooterProps {
  onNext: () => void;
  onPrevious: () => void;
  onReview: () => void;
  progress: string;
}

const Footer: React.FC<FooterProps> = ({
  onNext,
  onPrevious,
  onReview,
  progress,
}) => {
  return (
    <footer className="fixed bottom-0 left-0 flex w-full items-center justify-between border-t-2 border-gray-300 bg-white px-4 py-2.5 text-black">
      <p>John Doe</p>
      <button
        className="flex items-center gap-1 rounded-md bg-black py-1 pl-3 pr-1 text-sm font-bold tabular-nums text-white"
        onClick={onReview}
      >
        {progress} <ChevronUp className="ml-1 inline-block" />
      </button>
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
