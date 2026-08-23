"use client";

import { useEffect, useState } from "react";
import { getPartHeading } from "@/lib/frq/studentView";
import { getPartLabel } from "@/lib/frq/template";
import FeedbackSection from "./dropdownContent";
import type { FRQFeedbackDocument, FRQQuestion } from "./types";

export default function QuestionFeedback({
  frq,
  questionCount,
  questionIndex,
  feedbackData,
  readOnly = false,
  onFeedbackChange,
  onPointsChange,
}: {
  frq: FRQQuestion;
  /** Both are needed to say "Question 2, Part A" rather than just "Part A". */
  questionCount: number;
  questionIndex: number;
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
          {/*
            These have always been the question's parts. The heading called
            them questions back when the document held one flat list and the
            distinction did not exist; now that a page really is one question,
            leaving the word would have it contradict its own contents.
          */}
          <span>
            {frq.questions.length}{" "}
            {frq.questions.length === 1 ? "Part" : "Parts"}
          </span>
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

          // Shared with the test and review pages so a student reads the same
          // name for a part everywhere. `getPartLabel` also carries the walk
          // past 26 parts into AA, AB, which counting up from "A" does not.
          const label = getPartLabel(index);

          return (
            <FeedbackSection
              key={part.id}
              heading={getPartHeading(questionCount, questionIndex, label)}
              part={part}
              label={label}
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
