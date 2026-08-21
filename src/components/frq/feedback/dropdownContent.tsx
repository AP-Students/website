"use client";

import { ChevronDown, ChevronRight} from "lucide-react";

import { RenderContent } from "@/components/article-creator/custom_questions/RenderAdvancedTextbox";
import { Textarea } from "@/components/ui/textarea";

import RubricCriteriaRow from "./rubricCriteriaRow";
import type { FRQPart, FRQPartFeedback, ResponseAnswer } from "./types";

interface FeedbackSectionProps {
  part: FRQPart;
  label: string;
  questionNumber: number;
  answer?: ResponseAnswer;
  partFeedback?: FRQPartFeedback;
  isOpen: boolean;
  readOnly?: boolean;
  onToggle: () => void;
  onFeedbackChange: (feedback: string) => void;
  onPointsChange: (criterionId: string, points: number) => void;
}

export default function FeedbackSection({
  part,
  label,
  questionNumber,
  answer,
  partFeedback,
  isOpen,
  readOnly = false,
  onToggle,
  onFeedbackChange,
  onPointsChange,
}: FeedbackSectionProps) {
  const pointsEarned =
    partFeedback?.gradingCriteria.reduce(
      (total, criterion) => total + criterion.points,
      0,
    ) ?? 0;

  const pointsPossible = part.gradingCriteria.reduce(
    (total, criterion) => total + criterion.points,
    0,
  );

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center bg-gray-100 text-left"
      >
        <span className="flex self-stretch items-center bg-black px-3 font-bold text-white">
          {label}
        </span>

        <div className="flex flex-1 items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2 font-bold"><span>Question {questionNumber}</span>
          <span>|</span>
          <span>{pointsPossible} Points</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">
              {pointsEarned}/{pointsPossible} earned
            </span>

            {isOpen ? (
              <ChevronDown className="size-5" />
            ) : (
              <ChevronRight className="size-5" />
            )}
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          <RenderContent content={part.prompt} origin="question" />

          <div className="rounded-md border border-gray-400 p-3">
            <RenderContent
              content={{
                value: answer?.value ?? "No response submitted.",
                files: [],
              }}
              origin="content"
            />
          </div>

          <div>
            {part.gradingCriteria.map((criterion) => {
              const criterionScore = partFeedback?.gradingCriteria.find(
                (score) => score.criterionId === criterion.id,
              );

              return (
                <RubricCriteriaRow
                  key={criterion.id}
                  criterion={criterion}
                  points={criterionScore?.points ?? 0}
                  readOnly={readOnly}
                  onPointsChange={(points) =>
                    onPointsChange(criterion.id, points)
                  }
                />
              );
            })}
          </div>

          {readOnly ? (
            <div className="rounded-md border border-gray-400 p-3 text-sm leading-6">
              <p className="mb-1 font-semibold">Grader feedback</p>
              <p className="whitespace-pre-wrap">
                {partFeedback?.feedback?.trim()
                  ? partFeedback.feedback
                  : "The grader did not leave a note for this part."}
              </p>
            </div>
          ) : (
            <Textarea
              value={partFeedback?.feedback ?? ""}
              onChange={(event) => onFeedbackChange(event.target.value)}
              placeholder="Enter feedback"
              className="min-h-24 resize-y border-gray-400"
            />
          )}
        </div>
      )}
    </div>
  );
}