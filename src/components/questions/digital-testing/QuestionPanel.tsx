import { type QuestionFormat } from "@/types/questions";
import { useState } from "react";
import clsx from "clsx";
import "@/styles/strikeThrough.css";
import { RenderContent } from "@/components/article-creator/custom_questions/RenderAdvancedTextbox";
import { Check, X } from "lucide-react";

interface QuestionPanelProps {
  showEliminationTools: boolean;
  questionInstance: QuestionFormat | undefined;
  selectedAnswers: string[];
  onSelectAnswer: (optionId: string) => void;
  currentQuestionIndex: number; // Pass current question index as a prop
  questionsLength: number;
  submitted: boolean;
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
        "flex size-7 h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-black text-center",
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
      onClick={(e) => {
        e.preventDefault();  // Prevents clicks on the StrikeButton from selecting/unselecting the answer choice.
        onClick();
      }}
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
  submitted,
}: QuestionPanelProps) {
  // Array of Sets, each Set represents striked answers for one question
  const [strikedAnswers, setStrikedAnswers] = useState<Set<number>[]>(
    Array(questionsLength)
      .fill(null)
      .map(() => new Set<number>()),
  );

  if (!questionInstance) return null;

  const toggleStrike = (index: number, optionId: string) => {
    const newStrikedAnswers = [...strikedAnswers];
    const currentStrikes = new Set(newStrikedAnswers[currentQuestionIndex]);

    if (currentStrikes.has(index)) {
      currentStrikes.delete(index);
    } else {
      currentStrikes.add(index);

      if (selectedAnswers.includes(optionId)) {
        onSelectAnswer(optionId); // Toggle selection off
      }
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
            strikedAnswers[currentQuestionIndex]?.has(index);

          return (
            <div key={option.id} className="group relative">
              <div
                className={clsx(
                  "relative rounded-lg border-2 border-black transition-opacity",
                  isStrikedThrough && "striked-through",
                  submitted &&
                    selectedAnswers.includes(option.id) &&
                    questionInstance.answers.includes(option.id) &&
                    "border-green-500 bg-green-200",
                  submitted &&
                    selectedAnswers.includes(option.id) &&
                    !questionInstance.answers.includes(option.id) &&
                    "border-red-500 bg-red-200",
                )}
              >
                <label className="flex cursor-pointer items-center gap-2 p-2">
                  <LetterCircle
                    letter={String.fromCharCode(65 + index)}
                    checked={selectedAnswers.includes(option.id)}
                  />
                  <input
                    type={
                      questionInstance.type === "mcq" ? "radio" : "checkbox"
                    }
                    name="options"
                    value={option.id}
                    checked={selectedAnswers.includes(option.id)}
                    onChange={() => onSelectAnswer(option.id)}
                    disabled={submitted}
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

                  {!submitted && showEliminationTools && (
                    <div className="ml-auto flex items-center gap-2">
                      {isStrikedThrough ? (
                        <button
                          onClick={(e) => {
                            e.preventDefault(); // Prevents clicks on the "undo" button from selecting/unselecting the answer choice.
                            toggleStrike(index, option.id);
                          }}
                          className="text-sm font-medium text-[#3075c1]"
                        >
                          Undo
                        </button>
                      ) : (
                        <StrikeButton
                          letter={String.fromCharCode(65 + index)}
                          onClick={() => toggleStrike(index, option.id)}
                          active={isStrikedThrough}
                        />
                      )}
                    </div>
                  )}

                  {submitted &&
                    (questionInstance.answers.includes(option.id) ? (
                      <Check className="ml-auto stroke-green-500 stroke-[3px]" />
                    ) : (
                      <X className="ml-auto stroke-red-500 stroke-[3px]" />
                    ))}
                </label>
              </div>
            </div>
          );
        })}
        {submitted && (
          <div className="rounded-lg border bg-gray-100 p-3">
            <h3 className="mb-2 text-lg font-semibold">Explanation:</h3>
            <RenderContent content={questionInstance.explanation} />
          </div>
        )}
      </div>
    </div>
  );
}
