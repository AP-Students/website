"use client";

import React from "react";
import { QuestionFormat } from "@/types/questions";

interface Props {
  questions: QuestionFormat[];
  setQuestions: (questions: QuestionFormat[]) => void;
}

const QuestionsInputInterface: React.FC<Props> = ({ questions, setQuestions }) => {
  const addQuestion = () => {
    setQuestions([
      ...questions,
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
  };

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  const updateQuestion = (index: number, updatedQuestion: QuestionFormat) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    setQuestions(newQuestions);
  };

  return (
    <div className="mb-4 rounded border p-4">
      {questions.map((question, qIndex) => (
        <div key={qIndex} className="mb-4 rounded border p-4">
          <div>
            <label>{"Question: " + (qIndex + 1)}</label>
            <input
              type="text"
              value={question.body}
              onChange={(e) =>
                updateQuestion(qIndex, { ...question, body: e.target.value })
              }
              className="w-full border p-2"
            />
          </div>
          <div>
            <label>Options:</label>
            {question.options.map((option, oIndex) => (
              <div key={oIndex}>
                <input
                  type="text"
                  value={option.value}
                  onChange={(e) => {
                    const newOptions = [...question.options];
                    if (newOptions[oIndex]) {
                      newOptions[oIndex].value = e.target.value;
                      updateQuestion(qIndex, {
                        ...question,
                        options: newOptions,
                      });
                    }
                  }}
                  className="w-full border p-2"
                />
              </div>
            ))}
          </div>
          <div>
            <label>Correct Answer(s):</label>
            <input
              type="text"
              value={question.correct.join(",")}
              placeholder="Enter correct answer(s) separated by no spaced commas (eg: 1,3)"   
              onChange={(e) =>
                updateQuestion(qIndex, {
                  ...question,
                  correct: e.target.value.split(","),
                })
              }
              className="w-full border p-2"
            />
          </div>
          <div>
            <label>Question Type:</label>
            <select
              value={question.type}
              onChange={(e) =>
                updateQuestion(qIndex, {
                  ...question,
                  type: e.target.value as "mcq" | "multi-answer",
                })
              }
              className="w-full border p-2"
            >
              <option value="mcq">MCQ</option>
              <option value="multi-answer">Multi-Answer</option>
            </select>
          </div>
          <button
            type="button"
            className="mt-4 bg-red-500 text-white border border-red-500 rounded-md px-2 py-1  hover:bg-white hover:text-red-500"
            onClick={() => removeQuestion(qIndex)}
          >
            Delete Question
          </button>
        </div>
      ))}

      <button
        type="button"
        className="mt-4 bg-green-500 p-2 text-white border border-green-500 rounded-md px-2 py-1 hover:bg-white hover:text-green-500"
        onClick={addQuestion}
      >
        Add Question
      </button>
    </div>
  );
};

export default QuestionsInputInterface;
