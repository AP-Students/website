"use client";
import React, { useState } from "react";
import { MdOutlineRefresh } from "react-icons/md";
import { QuestionFormat } from "@/types/questions";

interface Props {
  questions: QuestionFormat[];
  currentQuestionIndex: number;
}

const CheckForUnderstanding: React.FC<Props> = ({
  questions,
  currentQuestionIndex,
}) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const question = questions[currentQuestionIndex]!;

  const handleSelectOption = (id: string) => {
    const numAnswers = question.correct.length;
    if (!submitted) {
      if (selectedOptions.includes(id)) {
        setSelectedOptions(selectedOptions.filter((oid) => oid !== id));
        return;
      }
      if (question.displayNumAnswers) {
        if (numAnswers > selectedOptions.length) {
          setSelectedOptions([id, ...selectedOptions]);
        }
      } else {
        setSelectedOptions([id, ...selectedOptions]);
      }
    }
  };

  const handleSubmit = () => {
    if (selectedOptions.length > 0) {
      setSubmitted(true);
      const allCorrect =
        question.correct.length === selectedOptions.length &&
        question.correct.every((id) => selectedOptions.includes(id));
      setIsCorrect(allCorrect);
    }
  };

  const isAnswerCorrect = (id: string) => {
    return question.correct.includes(id);
  };

  const handleRetry = () => {
    setSubmitted(false);
    setSelectedOptions([]);
    setIsCorrect(null);
  };

  return (
    <div className="max-w-6xl bg-primary-foreground p-4 md:p-6 lg:p-8">
      <div
        className="markdown text-xl font-bold md:text-2xl lg:text-3xl"
        dangerouslySetInnerHTML={{ __html: question.body }}
      />
      {question.displayNumAnswers && (
        <div className="markdown text-x4 md:text-2x1 lg:text-3x1 font-bold">{`${question.correct.length} correct options`}</div>
      )}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {question.options.map((option) => (
          <button
            key={option.id}
            className={`flex items-center justify-center rounded-lg border px-6 py-4 md:text-lg lg:text-xl
            ${
              submitted
                ? isAnswerCorrect(option.id)
                  ? selectedOptions.includes(option.id)
                    ? "border-green-700 bg-green-300"
                    : "border-green-700 bg-green-100"
                  : selectedOptions.includes(option.id)
                    ? "border-red-700 bg-red-300"
                    : "border-gray-300"
                : selectedOptions.includes(option.id)
                  ? "border-blue-500 bg-blue-100"
                  : "border-black bg-zinc-50"
            }
            `}
            onClick={() => handleSelectOption(option.id)}
            disabled={submitted}
          >
            {option.value}
          </button>
        ))}
      </div>
      {!submitted ? (
        <button
          className="mx-auto mt-4 block rounded bg-blue-500 px-6 py-2 text-white hover:bg-blue-600"
          onClick={handleSubmit}
        >
          Submit
        </button>
      ) : (
        <div className="sm: mt-4 flex justify-center gap-4">
          <button
            className={`rounded px-6 py-2 text-white ${isCorrect ? "bg-green-500" : "bg-red-500"}`}
            disabled
          >
            {isCorrect ? "Correct" : "Incorrect"}
          </button>

          <button
            className="flex items-center rounded bg-gray-500 py-2 pl-3 pr-4 text-white hover:bg-gray-600"
            onClick={handleRetry}
          >
            <MdOutlineRefresh size={24} style={{ color: "white" }} />

            <span>Retry</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default CheckForUnderstanding;

// Heres test questions if you want to try it out - put the code below in a page or else typescript will complain

// interface Option {
//   value: string;
//   id: string;
// }

// interface QuestionFormat {
//   body: string;
//   title: string;
//   type: "mcq" | "multi-answer";
//   options: Option[];
//   correct: string[];
//   course_id: string;
//   unit_ids: string[];
//   subunit_ids: string[];
// }

// const questions = [
//   {
//     body: "Who was the first president of the United States?",
//     title: "U.S. History",
//     type: "mcq",
//     options: [
//       { value: "George Washington", id: "1" },
//       { value: "John Adams", id: "2" },
//       { value: "Samuel Jackson", id: "3" },
//       { value: "Alexander Hamilton", id: "4" },
//     ],
//     correct: ["1"],
//     course_id: '1',
//     unit_ids: [],
//     subunit_ids: []
//   },
//   {
//     body: "Which of the following are NOT web development languages?",
//     title: "Computer Science",
//     type: "multi-answer",
//     options: [
//       { value: "Python", id: "1" },
//       { value: "HTML", id: "2" },
//       { value: "Java", id: "3" },
//       { value: "CSS", id: "4" },
//     ],
//     correct: ["1", "3"],
//     course_id: '2',
//     unit_ids: [],
//     subunit_ids: []
//   },
//   {
//     body: "What is the chemical symbol for water?",
//     title: "Chemistry",
//     type: "mcq",
//     options: [
//       { value: "O2", id: "1" },
//       { value: "H2O", id: "2" },
//       { value: "CO2", id: "3" },
//       { value: "H2O2", id: "4" },
//     ],
//     correct: ["2"],
//     course_id: '3',
//     unit_ids: [],
//     subunit_ids: []
//   },
//   {
//     body: "Which of these events occurred first in history?",
//     title: "World History",
//     type: "mcq",
//     options: [
//       { value: "The signing of the Magna Carta", id: "1" },
//       { value: "The fall of the Roman Empire", id: "2" },
//       { value: "The discovery of America", id: "3" },
//       { value: "The French Revolution", id: "4" },
//     ],
//     correct: ["2"],
//     course_id: '4',
//     unit_ids: [],
//     subunit_ids: []
//   }
// ] as QuestionFormat[];
