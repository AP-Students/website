import { useState, useEffect } from "react";
import { QuestionFormat } from "@/types/questions";

import CheckForUnderstanding from "@/components/questions/checkForUnderstanding";
import QuizRenderer from "@/components/questions/quizRenderer";
import QuestionsInputInterface from "./QuestionsInputInterface";

const useSyncedQuestions = (instanceId: string) => {
  const storageKey = `questions_${instanceId}`;
  const [questions, setQuestions] = useState<QuestionFormat[]>(() => {
    const savedQuestions = localStorage.getItem(storageKey);
    return savedQuestions
      ? JSON.parse(savedQuestions)
      : [
          {
            body: "",
            title: "",
            type: "mcq",
            options: [
              { value: "", id: "1" },
              { value: "", id: "2" },
              { value: "", id: "3" },
              { value: "", id: "4" },
            ],
            correct: [],
            course_id: "",
            unit_ids: [],
            subunit_ids: [],
          },
        ];
  });

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

export const QuestionsInput: React.FC<{ instanceId: string }> = ({ instanceId }) => {
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

export const QuestionsOutput: React.FC<{ instanceId: string }> = ({ instanceId }) => {
  const { questions } = useSyncedQuestions(instanceId);

  return (
    <div className="mt-8">
      {questions.length === 1 ? (
        <CheckForUnderstanding questions={questions} currentQuestionIndex={0} />
      ) : (
        <QuizRenderer questions={questions} />
      )}
    </div>
  );
};
