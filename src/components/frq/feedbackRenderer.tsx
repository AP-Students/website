"use client";

import { useState } from "react";
import Layout from "./feedback/layout";
import type { FRQFeedbackDocument } from "./feedback/types";
import { fallbackFeedbackData } from "./feedback/fallbackData_2";

interface FRQFeedbackRendererProps {
  feedbackData?: FRQFeedbackDocument;
}

export default function FRQFeedbackRenderer({feedbackData,}: FRQFeedbackRendererProps) {
  const [currentFrqIndex, setCurrentFrqIndex] = useState(0);

  const initialData =feedbackData ?? (fallbackFeedbackData as FRQFeedbackDocument);

  const[data, setData] = useState<FRQFeedbackDocument>(() => structuredClone(initialData));

  const currentFrq = data.frqs[currentFrqIndex];

  const goToPreviousFrq = () => {setCurrentFrqIndex((currentIndex) =>Math.max(currentIndex - 1, 0),);};

  const goToNextFrq = () => {setCurrentFrqIndex((currentIndex) => Math.min(currentIndex + 1, data.frqs.length - 1),);};

  const jumpToFrq = (index: number) => {
    if (index < 0 || index >= data.frqs.length) {
      return;
    }

    setCurrentFrqIndex(index);
  };

  const updatePartFeedback = (questionId: string, feedback: string,) => {
    setData((currentData) => ({
      ...currentData, 
      feedback: {
        ...currentData.feedback, 
        questions: currentData.feedback.questions.map(
          (question)=> question.questionId === questionId
          ?{
            ...question, feedback,}: question,
    ),
  },
}));
  };


const updateCriterionPoints = (questionId: string,criterionId: string,points: number) => {
  setData((currentData) => {
    const part = currentData.frqs
      .flatMap((frq) => frq.questions)
      .find((item) => item.id === questionId);

    const criterionDefinition =
      part?.gradingCriteria.find(
        (criterion) =>
          criterion.id === criterionId,
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
        questions:
          currentData.feedback.questions.map(
            (question) =>
              question.questionId !== questionId
                ? question
                : {
                    ...question,
                    gradingCriteria:
                      question.gradingCriteria.map(
                        (criterion) =>
                          criterion.criterionId ===
                          criterionId
                            ? {
                                ...criterion,
                                points:
                                  boundedPoints,
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
    onPrevious={goToPreviousFrq}
    onNext={goToNextFrq}
    onJumpToFrq={jumpToFrq}
    onFeedbackChange={updatePartFeedback}
    onPointsChange={updateCriterionPoints}
  />
);
}