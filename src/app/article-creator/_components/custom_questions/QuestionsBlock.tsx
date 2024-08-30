import React, { useState } from "react";
import { QuestionFormat } from "@/types/questions";
import QuestionInputInterface from "@/app/article-creator/_components/custom_questions/QuestionsInputInterface";
import CheckForUnderstanding from "@/components/questions/CheckForUnderstanding";
import QuizRenderer from "@/components/questions/QuizRenderer";

// If input is true, render input. Otherwise, render output.
interface QuestionsBlockProps {
  input: boolean;
}

// Correct the functional component definition
const QuestionsBlock: React.FC<QuestionsBlockProps> = ({ input }) => {
  const [questions, setQuestions] = useState<QuestionFormat[]>([
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
  ]);

  if (input) {
    return (
      <div>
        {/* Render QuestionInputInterface for adding and managing questions */}
        <QuestionInputInterface
          questions={questions}
          setQuestions={setQuestions}
        />
      </div>
    );
  } else {
    return (
      <div className="mt-8">
        {/* Conditionally render CheckForUnderstanding or QuizRenderer based on number of questions */}
        {questions.length === 1 ? (
          <CheckForUnderstanding
            questions={questions}
            currentQuestionIndex={0}
          />
        ) : (
          <QuizRenderer questions={questions} />
        )}
      </div>
    );
  }
};

export default QuestionsBlock;
