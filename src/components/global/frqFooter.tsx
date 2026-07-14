import { ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";


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
  return (
    <footer className="fixed bottom-0 left-0 z-50 flex h-14 w-full items-center justify-between border-t-2 border-gray-300 bg-white px-8">
      <p className="font-semibold">{testName}</p>

      <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
        <button
          onClick={onPrevious}
          className="rounded-md bg-black p-2 text-white"
        >
          <ChevronLeft className="size-5" />
        </button>

        <Popover>
            <PopoverTrigger className="flex items-center gap-1 rounded-md bg-black px-4 py-2 text-sm font-bold text-white">
                Question {currentFrqIndex + 1} of {totalFrqs}
                <ChevronUp className="size-4" />
            </PopoverTrigger>

            <PopoverContent className="w-40">
                <div className="flex flex-col gap-2">
                {Array.from({ length: totalFrqs }).map((_, index) => (
                    <button
                    key={index}
                    onClick={() => onJumpToFrq(index)}
                    className={`rounded-md px-3 py-2 text-left text-sm ${
                        index === currentFrqIndex
                        ? "bg-[#294ad1] font-bold text-white"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                    >
                    FRQ {index + 1}
                    </button>
                ))}
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
