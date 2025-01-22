import { Bookmark, ChevronUp, MapPin } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import clsx from "clsx";
import type { QuestionFormat } from "@/types/questions";
import { useRouter, usePathname } from "next/navigation";

interface FooterProps {
  goToQuestion: (index: number) => void;
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (index: number) => void;
  questions: QuestionFormat[];
  selectedAnswers: Record<number, string[]>;
  setShowReviewPage: (showReviewPage: boolean) => void;
  setSubmitted: (value: boolean) => void;
  showReviewPage: boolean;
  submitted: boolean;
}

export default function Footer({
  goToQuestion,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  questions,
  selectedAnswers,
  setShowReviewPage,
  showReviewPage,
  setSubmitted,
  submitted,
}: FooterProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleNext = () => {
    if (showReviewPage) {
      if (submitted) {
        if (
          confirm(
            "Exit the test? All progress will be lost. FiveHive does not currently save your progress (but we're working on it!).",
          )
        ) {
          router.push(pathname.split("/").slice(0, 3).join("/"));
        }
      } else {
        setCurrentQuestionIndex(0);
        setShowReviewPage(false);
        setSubmitted(true);
      }
    } else if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Review page will === currentQuestionIndex as a convienence; handlePrevious will kick it back to the last question given this logic
      setShowReviewPage(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0 && !showReviewPage) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
    setShowReviewPage(false);
  };

  return (
    <footer className="fixed bottom-0 left-0 z-20 flex w-full items-center justify-between border-t-2 border-gray-300 bg-white px-4 py-2.5 text-black">
      <p> </p>
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
              <span className="mr-1 size-6 border-2 border-dotted border-gray-400"></span>
              Unanswered
            </p>
            <p className="flex text-nowrap">
              <Bookmark className="mr-1 fill-black" /> For Review
            </p>
          </div>
          <div className="grid grid-cols-6 gap-4">
            {questions.map((question, i) => (
              <button
                key={i}
                className={clsx(
                  "relative flex size-8 items-center justify-center border-2",
                  {
                    "border-transparent bg-[#2a47bb] text-white":
                      selectedAnswers[i] && selectedAnswers[i].length > 0,
                    "border-dotted border-gray-400 text-[#2a47bb]":
                      !selectedAnswers[i]?.length,
                  },
                )}
                onClick={() => {
                  goToQuestion(i);
                  setShowReviewPage(false);
                }}
              >
                {i + 1}
                {question.bookmarked && (
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
          className="rounded-full bg-[#294ad1] px-6 py-2 font-bold text-white hover:bg-[#2a47bb]"
          onClick={handlePrevious}
        >
          Back
        </button>
        <button
          className="ml-3 rounded-full bg-[#294ad1] px-6 py-2 font-bold text-white hover:bg-[#2a47bb]"
          onClick={handleNext}
        >
          {currentQuestionIndex === questions.length - 1
            ? showReviewPage
              ? submitted
                ? "Exit"
                : "Submit"
              : "Review"
            : "Next"}
        </button>
      </div>
    </footer>
  );
}
