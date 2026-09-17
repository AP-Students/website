"use client";

import { RenderContent } from "@/components/article-creator/custom_questions/RenderAdvancedTextbox";
import { stripResponseHtml } from "@/lib/frq/template";

import type { GradingCriterion } from "./types";

export default function RubricCriteriaRow({
  criterion,
  points,
  readOnly = false,
  onPointsChange,
}: {
  criterion: GradingCriterion;
  points: number;
  readOnly?: boolean;
  onPointsChange: (points: number) => void;
}) {
  const updatePoints = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newPoints = Number(event.target.value);
    const boundedPoints = Math.min(Math.max(newPoints, 0), criterion.points);
    onPointsChange(boundedPoints);
  };

  // A criterion can carry a model graph rather than a sentence, so the row has
  // to render its text and files the way the prompt above it is rendered.
  // Printing `criterion.text` raw would also show the `<div>`s the editor's
  // rich-text field writes.
  const hasDescription =
    stripResponseHtml(criterion.text).length > 0 || criterion.files.length > 0;

  return (
    // Top-aligned rather than centred: a rubric line carrying a model graph is
    // far taller than the score beside it, and a one-line row is the same
    // height as that score either way.
    <div className="mb-2 flex items-start gap-3">
      {/* RenderContent's root carries its own vertical margin, which would
          loosen every text-only rubric row that never had one. */}
      <div className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-1 [&>div]:my-0">
        {hasDescription ? (
          <RenderContent
            content={{ value: criterion.text, files: criterion.files }}
            origin="question"
          />
        ) : (
          <span className="block">Untitled criterion</span>
        )}
      </div>

      <div className="flex shrink-0 items-baseline gap-1">
        {/* A student is being shown a settled grade, so the awarded points are
            rendered as text. Leaving the number input live implied the score
            could be edited from the feedback page. */}
        {readOnly ? (
          <span className="w-10 text-center text-2xl font-semibold tabular-nums">
            {points}
          </span>
        ) : (
          <input
            type="number"
            min={0}
            max={criterion.points}
            value={points}
            onChange={updatePoints}
            className="w-10 border-0 bg-transparent p-0 text-center text-2xl font-semibold outline-none focus:ring-0"
          />
        )}

        <span className="text-base">/{criterion.points}</span>
      </div>
    </div>
  );
}
