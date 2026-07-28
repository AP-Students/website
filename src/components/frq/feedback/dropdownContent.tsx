"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { RenderContent } from "@/components/article-creator/custom_questions/RenderAdvancedTextbox";
import RubricCriteriaRow from "./rubricCriteriaRow";
import type { FRQPart, FRQPartFeedback, ResponseAnswer } from "./types";
import { Textarea } from "@/components/ui/textarea";

interface FeedbackSectionProps {
  part: FRQPart;
  label: string;
  answer?: ResponseAnswer;
  partFeedback?: FRQPartFeedback;
  isOpen: boolean;
  onToggle: () => void;
  onFeedbackChange: (feedback: string) => void;
  onPointsChange: (criterionId: string, points: number) => void;
}

export default function FeedbackSection({
  part,
  label,
  answer,
  partFeedback,
  isOpen,
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
        className="flex w-full items-center bg-gray-100"
      >
        <span className="bg-black px-3 py-2 font-bold text-white">{label}</span>

        <p className="flex-1 px-3 text-left font-bold">
          {pointsEarned}/{pointsPossible} Points
        </p>

        <span className="px-3">
          {isOpen ? (
            <ChevronDown className="size-5" />
          ) : (
            <ChevronRight className="size-5" />
          )}
        </span>
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
                  onPointsChange={(points) =>
                    onPointsChange(criterion.id, points)
                  }
                />
              );
            })}
          </div>
          <Textarea
            value={partFeedback?.feedback ?? ""}
            onChange={(event) => onFeedbackChange(event.target.value)}
            placeholder="Enter feedback"
            className="min-h-24 resize-y border-gray-400"
          />
        </div>
      )}
    </div>
  );
}
