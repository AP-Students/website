"use client";

import { type QuestionFormat } from "@/types/questions";
import { useState } from "react";
import clsx from "clsx";
import "@/app/questions/digital-testing/styles/strikeThrough.css";

interface QuestionPanelProps {
  showEliminationTools: boolean;
  questionInstance: QuestionFormat | undefined;
  selectedAnswers: string[];
  onSelectAnswer: (optionId: string) => void;
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
        "flex size-7 items-center justify-center rounded-full border-2 border-black",
        {
          "bg-[#3075c1] text-white": checked,
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
  active: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex size-[18px] items-center justify-center rounded-full border border-black transition-colors line-through", 
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
}: QuestionPanelProps) {
  const [strikedAnswers, setStrikedAnswers] = useState<Set<number>>(new Set());
  const [isMarkedForReview, setIsMarkedForReview] = useState(false);

  if (!questionInstance) return null;

  const toggleStrike = (index: number) => {
    const newStrikes = new Set(strikedAnswers);
    if (newStrikes.has(index)) {
      newStrikes.delete(index);
    } else {
      newStrikes.add(index);
    }
    setStrikedAnswers(newStrikes);
  };

  return (
    <div className="relative">
      <div className="my-4 text-lg">{questionInstance.question.value}</div>

      <div className="grid gap-4">
        {questionInstance.options.map((option, index) => {
          const isStrikedThrough = strikedAnswers.has(index);

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
                    {option.value.value}
                  </span>

                  {showEliminationTools && (
                    <div className="flex items-center gap-2 ml-auto">
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
        stroke-width="1"
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
        stroke-width="1.5"
        stroke-linecap="round"
      />
    </svg>
  );
}
