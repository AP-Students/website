import { useState, useEffect } from "react";
import { type QuestionFormat } from "@/types/questions";
import CheckForUnderstanding from "@/components/questions/checkForUnderstanding";
import QuizRenderer from "@/components/questions/quizRenderer";
import QuestionsInputInterface from "./QuestionsInputInterface";


// This isn't a hook and I dont want it to be a hook; it works well anyways. 
/* eslint-disable react-hooks/rules-of-hooks */
export const syncedQuestions = (instanceId: string) => {
  const storageKey = `questions_${instanceId}`;
  const [questions, setQuestions] = useState<QuestionFormat[]>(() => {
    const savedQuestions = localStorage.getItem(storageKey);
    return savedQuestions
      ? JSON.parse(savedQuestions) as QuestionFormat[]
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
        ] as QuestionFormat[];
  });

  // Effect to update questions when localStorage is modified via the custom event
  useEffect(() => {
    const handleStorageUpdate = () => {
      console.log("Storage Key", storageKey);
      const updatedQuestions = localStorage.getItem(storageKey);
      if (updatedQuestions) {
        setQuestions(JSON.parse(updatedQuestions) as QuestionFormat[]);
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
/* eslint-enable react-hooks/rules-of-hooks */

export const QuestionsInput: React.FC<{ instanceId: string }> = ({
  instanceId,
}) => {
  const { questions, setQuestions } = syncedQuestions(instanceId);

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
  const { questions } = syncedQuestions(instanceId);

  return (
    <div className="mt-8">
      {questions.length === 1 ? (
        <CheckForUnderstanding
          questionInstance={questions[0]!}
        />
      ) : (
        <QuizRenderer questions={questions} />
      )}
    </div>
  );
};
