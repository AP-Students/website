"use client";

import { useState } from "react";
import Layout from "./feedback/layout";
import type { FRQFeedbackDocument } from "./feedback/types";

interface FRQFeedbackRendererProps {
  /**
   * Required. This used to be optional with a canned AP Human Geography
   * fallback, which meant a page that failed to build a real document rendered
   * a plausible-looking fake grade instead of an error.
   */
  feedbackData: FRQFeedbackDocument;
  /** Students see a settled grade; only a grading surface should edit it. */
  readOnly?: boolean;
  overallFeedback?: string;
}

export default function FRQFeedbackRenderer({
  feedbackData,
  readOnly = false,
  overallFeedback,
}: FRQFeedbackRendererProps) {
  const [currentFrqIndex, setCurrentFrqIndex] = useState(0);

  const [data, setData] = useState<FRQFeedbackDocument>(() =>
    structuredClone(feedbackData),
  );

  const currentFrq = data.frqs[currentFrqIndex];

  const goToPreviousFrq = () => {
    setCurrentFrqIndex((currentIndex) => Math.max(currentIndex - 1, 0));
  };

  const goToNextFrq = () => {
    setCurrentFrqIndex((currentIndex) =>
      Math.min(currentIndex + 1, data.frqs.length - 1),
    );
  };

  const jumpToFrq = (index: number) => {
    if (index < 0 || index >= data.frqs.length) {
      return;
    }

    setCurrentFrqIndex(index);
  };

  const updatePartFeedback = (questionId: string, feedback: string) => {
    setData((currentData) => ({
      ...currentData,
      feedback: {
        ...currentData.feedback,
        questions: currentData.feedback.questions.map((question) =>
          question.questionId === questionId
            ? {
                ...question,
                feedback,
              }
            : question,
        ),
      },
    }));
  };

  const updateCriterionPoints = (
    questionId: string,
    criterionId: string,
    points: number,
  ) => {
    setData((currentData) => {
      const part = currentData.frqs
        .flatMap((frq) => frq.questions)
        .find((item) => item.id === questionId);

      const criterionDefinition = part?.gradingCriteria.find(
        (criterion) => criterion.id === criterionId,
      );

      if (!criterionDefinition) {
        return currentData;
      }

      const boundedPoints = Math.min(
        Math.max(points, 0),
        criterionDefinition.points,
      );

      return {
        ...currentData,
        feedback: {
          ...currentData.feedback,
          questions: currentData.feedback.questions.map((question) =>
            question.questionId !== questionId
              ? question
              : {
                  ...question,
                  gradingCriteria: question.gradingCriteria.map((criterion) =>
                    criterion.criterionId === criterionId
                      ? {
                          ...criterion,
                          points: boundedPoints,
                        }
                      : criterion,
                  ),
                },
          ),
        },
      };
    });
  };

  if (!currentFrq) {
    return <p>No FRQ feedback available.</p>;
  }

  return (
    <Layout
      feedbackData={data}
      currentFrq={currentFrq}
      currentFrqIndex={currentFrqIndex}
      readOnly={readOnly}
      overallFeedback={overallFeedback}
      onPrevious={goToPreviousFrq}
      onNext={goToNextFrq}
      onJumpToFrq={jumpToFrq}
      onFeedbackChange={updatePartFeedback}
      onPointsChange={updateCriterionPoints}
    />
  );
}
