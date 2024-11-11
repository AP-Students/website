import { type QuestionFormat } from "@/types/questions";
import { useState } from "react";
import clsx from "clsx";
import "@/app/questions/digital-testing/styles/strikeThrough.css";
import { RenderContent } from "@/app/article-creator/_components/custom_questions/RenderAdvancedTextbox";

interface QuestionPanelProps {
  showEliminationTools: boolean;
  questionInstance: QuestionFormat | undefined;
  selectedAnswers: string[];
  onSelectAnswer: (optionId: string) => void;
  currentQuestionIndex: number; // Pass current question index as a prop
  questionsLength: number;
  submittedAnswers: boolean;
}

function LetterCircle({
  letter,
  checked,
}: {
  letter: string;
  checked: boolean;
}) {
  return (
    <span
      className={clsx(
        "flex size-7 h-8 w-8 items-center justify-center rounded-full border-2 border-black text-center",
        {
          "bg-[#3075c1] text-white": checked,
          aspectRatio: "1 / 1",
        },
      )}
    >
      {letter}
    </span>
  );
}

function StrikeButton({
  letter,
  onClick,
  active,
}: {
  letter: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex size-[18px] items-center justify-center rounded-full border border-black line-through transition-colors",
        active && "bg-gray-200",
      )}
    >
      <span className="sr-only">Strike through answer</span>
      {letter}
    </button>
  );
}

export default function QuestionPanel({
  showEliminationTools,
  questionInstance,
  selectedAnswers,
  onSelectAnswer,
  currentQuestionIndex,
  questionsLength,
  submittedAnswers,
}: QuestionPanelProps) {
  // Array of Sets, each Set represents striked answers for one question
  const [strikedAnswers, setStrikedAnswers] = useState<Set<number>[]>(
    Array(questionsLength)
      .fill(null)
      .map(() => new Set<number>()),
  );

  if (!questionInstance) return null;

  const toggleStrike = (index: number) => {
    const newStrikedAnswers = [...strikedAnswers];
    const currentStrikes = new Set(newStrikedAnswers[currentQuestionIndex]);

    if (currentStrikes.has(index)) {
      currentStrikes.delete(index);
    } else {
      currentStrikes.add(index);
    }

    newStrikedAnswers[currentQuestionIndex] = currentStrikes;
    setStrikedAnswers(newStrikedAnswers);
  };

  return (
    <div className="relative">
      <div className="my-4 text-lg">
        <RenderContent content={questionInstance.question} />
      </div>

      <div className="grid gap-4">
        {questionInstance.options.map((option, index) => {
          const isStrikedThrough =
            strikedAnswers[currentQuestionIndex] &&
            strikedAnswers[currentQuestionIndex].has(index);

          return (
            <div key={option.id} className="group relative">
              <div
                className={clsx(
                  "relative rounded-lg border-2 border-black transition-opacity",
                  isStrikedThrough && "striked-through",
                )}
              >
                <label className="flex cursor-pointer items-center gap-2 p-2">
                  <LetterCircle
                    letter={String.fromCharCode(65 + index)}
                    checked={selectedAnswers.includes(option.id)}
                  />
                  <input
                    type="radio"
                    name="options"
                    value={option.id}
                    checked={selectedAnswers.includes(option.id)}
                    onChange={() => onSelectAnswer(option.id)}
                    hidden
                  />
                  <span
                    className={clsx(
                      "transition-opacity",
                      isStrikedThrough && "opacity-50",
                    )}
                  >
                    <RenderContent content={option.value} />
                  </span>

                  {showEliminationTools && (
                    <div className="ml-auto flex items-center gap-2">
                      {isStrikedThrough ? (
                        <button
                          onClick={() => toggleStrike(index)}
                          className="text-sm font-medium text-[#3075c1]"
                        >
                          Undo
                        </button>
                      ) : (
                        <StrikeButton
                          letter={String.fromCharCode(65 + index)}
                          onClick={() => toggleStrike(index)}
                          active={isStrikedThrough}
                        />
                      )}
                    </div>
                  )}
                </label>
              </div>
            </div>
          );
        })}
        {submittedAnswers && (
          <div className="rounded-lg bg-green-100 p-4">
            <h3 className="mb-2 text-lg font-semibold">Explanation:</h3>
            <RenderContent content={questionInstance.explanation} />
          </div>
        )}
      </div>
    </div>
  );
}

export function ABC() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
    >
      <rect
        x="1"
        y="1"
        width="18"
        height="18"
        rx="2"
        ry="2"
        fill="#E0E0E0"
        stroke="#000"
        strokeWidth="1"
      />
      <text
        x="4"
        y="12"
        font-family="Arial, sans-serif"
        font-size="5"
        font-weight="bold"
        fill="#000"
      >
        ABC
      </text>
      <line
        x1="3"
        y1="3"
        x2="17"
        y2="17"
        stroke="#000"
        strokeWidth="1.5"
        stroke-linecap="round"
      />
    </svg>
  );
}
