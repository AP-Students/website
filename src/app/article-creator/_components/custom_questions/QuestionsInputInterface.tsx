"use client";

import React, { useState } from "react";
import { QuestionFormat } from "@/types/questions";
import { Trash, CirclePlus } from "lucide-react";
import AdvancedTextbox from "./AdvancedTextbox";
import { Input } from "@/components/ui/input";

interface Props {
  questions: QuestionFormat[];
  setQuestions: (questions: QuestionFormat[]) => void;
}

const QuestionsInputInterface: React.FC<Props> = ({
  questions,
  setQuestions,
}) => {
  const [error, setError] = useState<string>("");

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        title: "",
        body: {
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
        correct: [],
        explanation: {
          value: "",
        },
        course_id: "",
        unit_ids: [],
        subunit_ids: [],
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
    setError("");
  };

  const updateQuestion = (index: number, updatedQuestion: QuestionFormat) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    setQuestions(newQuestions);
  };

  const addOption = (qIndex: number) => {
    const newQuestions = [...questions];
    const newOptions = [
      ...newQuestions[qIndex]!.options,
      {
        value: {
          value: "",
        },
        id: Date.now().toString(),
      },
    ];
    newQuestions[qIndex]!.options = newOptions;
    setQuestions(newQuestions);
  };

  const deleteOption = (qIndex: number, oIndex: number) => {
    const newQuestions = [...questions];
    const newOptions = newQuestions[qIndex]!.options.filter(
      (_, index) => index !== oIndex,
    );
    newQuestions[qIndex]!.options = newOptions;
    setQuestions(newQuestions);
  };

  const validateCorrectAnswer = (
    value: string,
    type: "mcq" | "multi-answer",
  ) => {
    let errorMessage = "";
    if (type === "mcq") {
      if (!/^\d$/.test(value)) {
        errorMessage = "Only a single number is allowed for MCQ. (eg 1)";
      }
    } else {
      if (!/^\d(,\d){0,7}$/.test(value) || value.length > 8) {
        errorMessage =
          "Only numbers separated by commas are allowed, max correct questions is 4. (eg 1,2,4)";
      }
    }
    setError(errorMessage);
    return errorMessage === "";
  };

  return (
    <div className="mb-4 rounded border p-4">
      {questions.map((question, qIndex) => (
        <div key={qIndex} className="mb-4 rounded border p-4">
          <div>
            <label>{"Question: " + (qIndex + 1)}</label>
            <AdvancedTextbox
              questions={questions}
              setQuestions={setQuestions}
              origin={"body"}
              qIndex={qIndex}
            />
          </div>

          <div className="my-4">
            <span className="text-lg font-bold">Options</span>
            {question.options.map((option, oIndex) => (
              <div key={oIndex} className="mb-2 min-w-full">
                <div className="flex justify-between">
                  Option {oIndex + 1}
                  <button
                    type="button"
                    onClick={() => deleteOption(qIndex, oIndex)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash size={20} />
                  </button>
                </div>
                <AdvancedTextbox
                  questions={questions}
                  setQuestions={setQuestions}
                  origin={"option"}
                  qIndex={qIndex}
                  oIndex={oIndex}
                  placeholder="Enter option here..."
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => addOption(qIndex)}
              className="flex items-center text-green-500 hover:text-green-600"
            >
              Add option <CirclePlus className="ml-1 inline" />
            </button>
          </div>

          <div className="my-4">
            <div className="flex items-center gap-2">
              <label htmlFor="correctAnswer">Correct answer(s)</label>
              <Input
                id="correctAnswer"
                type="text"
                value={question.correct.join(",")} // Convert array back to string for input display
                placeholder={
                  question.type === "mcq" ? "Example: 1" : "Example: 1,3"
                }
                onChange={(e) => {
                  const inputValue = e.target.value;
                  const correctAnswers = inputValue
                    .split(",")
                    .map((answer) => answer.trim());
                  updateQuestion(qIndex, {
                    ...question,
                    correct: correctAnswers,
                  });
                  validateCorrectAnswer(inputValue, question.type);
                }}
                className="w-fit grow"
              />
            </div>
            {error && <div className="text-red-500">{error}</div>}
          </div>

          <div className="my-4">
            <label>
              Explanation (optional)
              <AdvancedTextbox
                questions={questions}
                setQuestions={setQuestions}
                origin={"explanation"}
                qIndex={qIndex}
                placeholder="Explain the answer here..."
              />
            </label>
          </div>

          <div>
            <label>Question type:</label>
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
            className="mt-4 rounded-md border border-red-500 bg-red-500 px-3 py-1 text-white transition-colors hover:bg-white hover:text-red-500"
            onClick={() => removeQuestion(qIndex)}
          >
            Delete question
          </button>
        </div>
      ))}

      <button
        type="button"
        className="rounded-md border border-green-500 bg-green-500 px-3 py-1 text-white transition-colors hover:bg-white hover:text-green-500"
        onClick={addQuestion}
      >
        Add question
      </button>
    </div>
  );
};

export default QuestionsInputInterface;
