"use client";

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
  return (
    <div className="mb-2 flex items-center gap-3">
      <p className="flex-1 rounded-md border border-gray-300 px-3 py-1">
        {criterion.text}
      </p>

      <div className="flex items-baseline gap-1">
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
