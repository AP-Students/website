"use client";

import React, { useEffect, useState } from "react";
import type { QuestionFormat } from "@/types/questions";
import {
  Trash,
  CirclePlus,
  ChevronDown,
  ChevronUp,
  MoveUp,
  MoveDown,
} from "lucide-react";
import AdvancedTextbox from "./AdvancedTextbox";
import { Input } from "@/components/ui/input";

interface Props {
  questions: QuestionFormat[];
  setQuestions: (questions: QuestionFormat[]) => void;
  testRenderer?: boolean;
  setUnsavedChanges?: (unsavedChanges: boolean) => void;
}

const QuestionsInputInterface: React.FC<Props> = ({
  questions,
  setQuestions,
  testRenderer = false,
  setUnsavedChanges,
}) => {
  const [error, setError] = useState<string>("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [collapsed, setCollapsed] = useState<boolean[]>([]);

  useEffect(() => {
    if (collapsed.length === 0 && questions.length > 0) {
      setCollapsed(Array(questions.length).fill(true));
    }
  }, [collapsed.length, questions]);

  const toggleCollapse = (index: number) => {
    setCollapsed((prev) => {
      const newCollapsed = [...prev];
      if (newCollapsed[index]) {
        newCollapsed.fill(true);
      }
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
          files: [],
        },
        type: "mcq",
        options: [
          {
            value: {
              value: "",
              files: [],
            },
            id: "1",
          },
          { value: { value: "", files: [] }, id: "2" },
          { value: { value: "", files: [] }, id: "3" },
          { value: { value: "", files: [] }, id: "4" },
        ],
        answers: [""],
        explanation: {
          value: "",
          files: [],
        },
        content: {
          value: "",
          files: [],
        },
        bookmarked: false,
        topic: "",
      },
    ]);

    // Ensure new question starts as expanded and collapse all other questions
    setCollapsed((prev) => [...prev].fill(true).concat(false));
    setUnsavedChanges?.(true);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
    setError("");
    setCollapsed((prev) => prev.filter((_, i) => i !== index));
    setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));
    setUnsavedChanges?.(true);
  };

  const updateQuestion = (index: number, updatedQuestion: QuestionFormat) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    setQuestions(newQuestions);
    setUnsavedChanges?.(true);
  };

  const moveQuestionUp = (index: number) => {
    if (index === 0) return;
    const newQuestions = [...questions];
    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[index - 1]!;
    newQuestions[index - 1] = temp!;
    setQuestions(newQuestions);
    setUnsavedChanges?.(true);
  };

  const moveQuestionDown = (index: number) => {
    if (index === questions.length - 1) return;
    const newQuestions = [...questions];
    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[index + 1]!;
    newQuestions[index + 1] = temp!;
    setQuestions(newQuestions);
    setUnsavedChanges?.(true);
  };

  const addOption = (qIndex: number) => {
    const newQuestions = [...questions];
    const newOptions = [
      ...newQuestions[qIndex]!.options,
      {
        value: {
          value: "",
          files: [],
        },
        id: Date.now().toString(),
      },
    ];
    newQuestions[qIndex]!.options = newOptions;
    setQuestions(newQuestions);
    setUnsavedChanges?.(true);
  };

  const deleteOption = (qIndex: number, oIndex: number) => {
    const newQuestions = [...questions];
    const newOptions = newQuestions[qIndex]!.options.filter(
      (_, index) => index !== oIndex,
    );
    newQuestions[qIndex]!.options = newOptions;
    setQuestions(newQuestions);
    setUnsavedChanges?.(true);
  };

  // Filters out different keyboard numbers
  const normalizeAnswer = (answer: string): string => {
    // Normalize the string and remove any special characters or different encodings
    return answer
      .normalize("NFKD") // Normalize to decomposed form
      .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
      .replace(/[^\d,]/g, ""); // Keep only digits and commas
  };

  const validateCorrectAnswer = (
    value: string,
    type: "mcq" | "multi-answer",
  ) => {
    const normalizedValue = normalizeAnswer(value);
    let errorMessage = "";
    
    if (type === "mcq") {
      if (!/^\d$/.test(normalizedValue)) {
        errorMessage = "Only a single number is allowed for MCQ. (e.g. 1)";
      }
    } else {
      if (!/^\d(,\d){0,7}$/.test(normalizedValue) || normalizedValue.length > 8) {
        errorMessage =
          "Only numbers separated by commas are allowed, max correct questions is 4. (e.g. 1,2,4)";
      }
    }
    setError(errorMessage);
    return errorMessage === "";
  };

  return (
    <div className="grid gap-3">
      {questions.map((questionInstance, qIndex) => (
        <div
          key={qIndex}
          className="overflow-hidden rounded border border-black p-2 shadow"
        >
          <div className="flex">
            <MoveUp
              className="shrink-0 cursor-pointer transition-transform hover:scale-110"
              onClick={() => moveQuestionUp(qIndex)}
            />
            <MoveDown
              className="shrink-0 cursor-pointer transition-transform hover:scale-110"
              onClick={() => moveQuestionDown(qIndex)}
            />
            <button
              onClick={() => toggleCollapse(qIndex)}
              className="ml-2 flex grow justify-between gap-3 overflow-hidden hover:underline"
            >
              <span className="shrink-0 font-bold">Question {qIndex + 1}</span>
              <span className="overflow-hidden text-ellipsis text-nowrap opacity-75">
                {questionInstance.question.value}
              </span>
              <span className="shrink-0">
                {collapsed[qIndex] ? <ChevronDown /> : <ChevronUp />}
              </span>
            </button>
          </div>
          {!collapsed[qIndex] && (
            <div>
              {testRenderer && (
                <div className="my-4">
                  <label>Content:</label>
                  <AdvancedTextbox
                    questions={questions}
                    setQuestions={setQuestions}
                    setUnsavedChanges={setUnsavedChanges}
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
                  setUnsavedChanges={setUnsavedChanges}
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
                      setUnsavedChanges={setUnsavedChanges}
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
                  Add option <CirclePlus className="ml-1 size-5" />
                </button>
              </div>

              <div className="my-4 flex justify-between gap-2">
                <div className="max-w-48">
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
                  />
                  {error && <div className="text-red-500">{error}</div>}
                </div>
                <div>
                  <label htmlFor="topic">Topic</label>
                  <Input
                    id="topic"
                    type="text"
                    value={questionInstance.topic ?? ""}
                    placeholder="1.1"
                    onChange={(e) => {
                      updateQuestion(qIndex, {
                        ...questionInstance,
                        topic: e.target.value,
                      });
                    }}
                    className="w-fit grow"
                  />
                </div>
              </div>

              <div className="my-4">
                <label>Explanation (optional)</label>
                <AdvancedTextbox
                  questions={questions}
                  setQuestions={setQuestions}
                  setUnsavedChanges={setUnsavedChanges}
                  origin={"explanation"}
                  qIndex={qIndex}
                  placeholder="Explain the answer here..."
                />
              </div>

              <div className="flex items-center gap-2">
                <label>Question type:</label>
                <select
                  value={questionInstance.type}
                  onChange={(e) =>
                    updateQuestion(qIndex, {
                      ...questionInstance,
                      type: e.target.value as "mcq" | "multi-answer",
                    })
                  }
                  className="rounded-md border border-gray-300 bg-gray-50 p-2"
                >
                  <option value="mcq">MCQ</option>
                  <option value="multi-answer">Multi-Answer</option>
                </select>

                <button
                  type="button"
                  className="ml-auto rounded border border-red-500 bg-red-500 px-2 py-1 text-white transition-colors hover:bg-white hover:text-red-500"
                  onClick={() => {
                    if (confirm("Delete this question?")) {
                      removeQuestion(qIndex);
                    }
                  }}
                >
                  Delete question
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        className="rounded border border-green-500 bg-green-500 px-2 py-1 text-white transition-colors hover:bg-white hover:text-green-500"
        onClick={addQuestion}
      >
        Add question
      </button>
    </div>
  );
};

export default QuestionsInputInterface;
