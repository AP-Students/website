import { useState, useEffect } from "react";
import { QuestionFormat } from "@/types/questions";

import CheckForUnderstanding from "@/app/questions/checkForUnderstanding";
import QuizRenderer from "@/app/questions/quizRenderer";
import QuestionsInputInterface from "./QuestionsInputInterface";
import TestRenderer from "@/app/questions/testRenderer";
import AITestRenderer from "@/app/questions/AITestRenderer";

const useSyncedQuestions = (instanceId: string) => {
  const storageKey = `questions_${instanceId}`;
  const [questions, setQuestions] = useState<QuestionFormat[]>(() => {
    const savedQuestions = localStorage.getItem(storageKey);
    return savedQuestions
      ? JSON.parse(savedQuestions)
      : [
          {
            question: {
              value: "",
            },
            type: "mcq",
            options: [
              {
                value: {
                  value: "",
                },
                id: "1",
              },
              { value: { value: "" }, id: "2" },
              { value: { value: "" }, id: "3" },
              { value: { value: "" }, id: "4" },
            ],
            answers: [""],
            explanation: {
              value: "",
            },
            content: {
              value: "",
            },
            bookmarked: false,
          },
        ];
  });

  // Effect to update questions when localStorage is modified via the custom event
  useEffect(() => {
    const handleStorageUpdate = () => {
      const updatedQuestions = localStorage.getItem(storageKey);
      if (updatedQuestions) {
        setQuestions(JSON.parse(updatedQuestions));
      }
    };

    // Listen for custom event triggered by QuestionsAddCard
    window.addEventListener("questionsUpdated", handleStorageUpdate);

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener("questionsUpdated", handleStorageUpdate);
    };
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(questions));
  }, [questions, storageKey]);

  // Clean up local storage on component unmount or page unload
  useEffect(() => {
    const handleUnload = () => {
      localStorage.removeItem(storageKey);
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [storageKey]);

  return { questions, setQuestions };
};

export const QuestionsInput: React.FC<{ instanceId: string }> = ({
  instanceId,
}) => {
  const { questions, setQuestions } = useSyncedQuestions(instanceId);

  return (
    <div>
      <QuestionsInputInterface
        questions={questions}
        setQuestions={setQuestions}
      />
    </div>
  );
};

export const QuestionsOutput: React.FC<{ instanceId: string }> = ({
  instanceId,
}) => {
  const { questions } = useSyncedQuestions(instanceId);

  return (
    <div className="mt-8">
      {questions.length === 1 ? (
        <CheckForUnderstanding
          questionInstance={questions[0] as QuestionFormat}
        />
      ) : (
        <TestRenderer /> 
        // <QuizRenderer questions={questions} />
      )}
      {/* Code to indicate that this is a test instance */}
      {/* Import Page from /questions/digital-testing/page.tsx */}
    </div>
  );
};
