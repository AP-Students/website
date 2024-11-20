"use client";

import React, { useState } from "react";
import { QuestionFormat } from "@/types/questions";
import { Trash, CirclePlus } from "lucide-react";
import AdvancedTextbox from "./AdvancedTextbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  questions: QuestionFormat[];
  setQuestions: (questions: QuestionFormat[]) => void;
  testRenderer?: boolean;
}

const QuestionsInputInterface: React.FC<Props> = ({
  questions,
  setQuestions,
  testRenderer = false,
}) => {
  const [error, setError] = useState<string>("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [collapsed, setCollapsed] = useState<boolean[]>(
    Array(questions.length).fill(false),
  );

  const toggleCollapse = (index: number) => {
    setCollapsed((prev) => {
      const newCollapsed = [...prev];
      newCollapsed[index] = !newCollapsed[index];
      return newCollapsed;
    });
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
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
    ]);
    setCollapsed((prev) => [...prev, false]); // Ensure new question starts as expanded
  };

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
    setError("");
    setCollapsed((prev) => prev.filter((_, i) => i !== index));
    setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));
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
      {questions.map((questionInstance, qIndex) => (
        <div key={qIndex} className="mb-4 rounded border p-4">
          <Button
            onClick={() => toggleCollapse(qIndex)}
            className="flex w-full justify-between text-left text-lg font-bold"
          >
            {"Question: " + (qIndex + 1)}
          </Button>
          {!collapsed[qIndex] && (
            <div>
              {testRenderer && (
                <div className="my-4">
                  <label>Content:</label>
                  <AdvancedTextbox
                    questions={questions}
                    setQuestions={setQuestions}
                    origin={"content"}
                    qIndex={qIndex}
                  />
                </div>
              )}

              <div>
                <label>Question:</label>
                <AdvancedTextbox
                  questions={questions}
                  setQuestions={setQuestions}
                  origin={"question"}
                  qIndex={qIndex}
                />
              </div>

              <div className="my-4">
                <span className="text-lg font-bold">Options</span>
                {questionInstance.options.map((option, oIndex) => (
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
                <label htmlFor="correctAnswer">Correct answer(s)</label>
                <Input
                  id="correctAnswer"
                  type="text"
                  value={questionInstance.answers.join(",")}
                  placeholder={
                    questionInstance.type === "mcq"
                      ? "Example: 1"
                      : "Example: 1,3"
                  }
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    const correctAnswers = inputValue
                      .split(",")
                      .map((answer) => answer.trim());
                    updateQuestion(qIndex, {
                      ...questionInstance,
                      answers: correctAnswers,
                    });
                    validateCorrectAnswer(inputValue, questionInstance.type);
                  }}
                  className="w-fit grow"
                />
                {error && <div className="text-red-500">{error}</div>}
              </div>

              <div className="my-4">
                <label>Explanation (optional)</label>
                <AdvancedTextbox
                  questions={questions}
                  setQuestions={setQuestions}
                  origin={"explanation"}
                  qIndex={qIndex}
                  placeholder="Explain the answer here..."
                />
              </div>

              <div>
                <label>Question type:</label>
                <select
                  value={questionInstance.type}
                  onChange={(e) =>
                    updateQuestion(qIndex, {
                      ...questionInstance,
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
          )}
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
