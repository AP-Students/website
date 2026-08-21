"use client";

import { useEffect, useState } from "react";
import FeedbackSection from "./dropdownContent";
import type { FRQFeedbackDocument, FRQQuestion } from "./types";

export default function QuestionFeedback({
  frq,
  feedbackData,
  readOnly = false,
  onFeedbackChange,
  onPointsChange,
}: {
  frq: FRQQuestion;
  feedbackData: FRQFeedbackDocument;
  readOnly?: boolean;
  onFeedbackChange: (questionId: string, feedback: string) => void;
  onPointsChange: (
    questionId: string,
    criterionId: string,
    points: number,
  ) => void;
}) {
  const [openParts, setOpenParts] = useState<string[]>(
    frq.questions[0] ? [frq.questions[0].id] : [],
  );

  useEffect(() => {
    setOpenParts(frq.questions[0] ? [frq.questions[0].id] : []);
  }, [frq]);

  const togglePart = (partId: string) => {
    setOpenParts((currentParts) =>
      currentParts.includes(partId)
        ? currentParts.filter((id) => id !== partId)
        : [...currentParts, partId],
    );
  };

  const closeAll = () => {
    setOpenParts([]);
  };

  return (
    <section className="h-full overflow-y-auto px-16 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-bold">
  <span>{frq.name}</span>
  <span>|</span>
  <span>{frq.questions.length} Questions</span>
  <span>|</span>
</h1>

        <button
          type="button"
          onClick={closeAll}
          className="rounded-md bg-black px-10 py-2 font-semibold text-white"
        >
          Close All
        </button>
      </div>

      <div className="space-y-6">
        {frq.questions.map((part, index) => {
          const answer = feedbackData.response.answers.find(
            (item) => item.questionId === part.id,
          );

          const partFeedback = feedbackData.feedback.questions.find(
            (item) => item.questionId === part.id,
          );

          return (
            <FeedbackSection
              key={part.id}
              questionNumber={index + 1}
              part={part}
              label={String.fromCharCode(65 + index)}
              answer={answer}
              partFeedback={partFeedback}
              isOpen={openParts.includes(part.id)}
              readOnly={readOnly}
              onToggle={() => togglePart(part.id)}
              onFeedbackChange={(feedback) =>
                onFeedbackChange(part.id, feedback)
              }
              onPointsChange={(criterionId, points) =>
                onPointsChange(part.id, criterionId, points)
              }
            />
          );
        })}
      </div>
    </section>
  );
}
