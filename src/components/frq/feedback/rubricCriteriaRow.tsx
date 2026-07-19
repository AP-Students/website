


"use client";

import { useState, useEffect } from "react";
import type { GradingCriterion } from "./types";



export default function RubricCriteriaRow({criterion, points, onPointsChange}: {criterion: GradingCriterion, points: number, onPointsChange: (points:number)=>void;}) {
  const [earnedPoints, setEarnedPoints] = useState(points);
  useEffect(()=> {
    setEarnedPoints(points);}, [points]
  );
  const updatePoints = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newPoints = Number(event.target.value);
  const boundedPoints = Math.min(Math.max(newPoints, 0), criterion.points);
  setEarnedPoints(boundedPoints);
  onPointsChange(boundedPoints)};
  return (
    <div className="mb-2 flex items-center gap-3">
      <p className="flex-1 rounded-md border border-gray-300 px-3 py-1">
        {criterion.text}
      </p>

      <div className="flex items-baseline gap-1">
        <input
          type="number"
          min={0}
          max={criterion.points}
          value={earnedPoints}
          onChange={updatePoints}
          className="w-10 rounded border border-gray-300 text-center text-2xl font-semibold"
        />

        <span className="text-base">/{criterion.points}</span>
      </div>
    </div>
  );
}