"use client";

// TEMPORARY preview route for verifying FRQ support. Safe to delete.
import React, { useState } from "react";
import type { QuestionFormat } from "@/types/questions";
import QuestionsInputInterface from "@/components/article-creator/custom_questions/QuestionsInputInterface";
import CheckForUnderstanding from "@/components/questions/checkForUnderstanding";
import QuizRenderer from "@/components/questions/quizRenderer";

const frq: QuestionFormat = {
  question: { value: "What is the derivative of $@x^2$ with respect to x?", files: [] },
  type: "frq",
  options: [],
  answers: [],
  explanation: { value: "$@\\frac{d}{dx}x^2 = 2x$", files: [] },
  content: { value: "", files: [] },
  topic: "2.1",
};

const mcq: QuestionFormat = {
  question: { value: "Which function represents exponential growth?", files: [] },
  type: "mcq",
  options: [
    { value: { value: "$@f(x) = -3x + 8$", files: [] }, id: "1" },
    { value: { value: "$@f(x) = 2(3)^x$", files: [] }, id: "2" },
  ],
  answers: ["2"],
  explanation: { value: "A base greater than 1 grows.", files: [] },
  content: { value: "", files: [] },
  topic: "1.1",
};

export default function FrqPreview() {
  const [questions, setQuestions] = useState<QuestionFormat[]>([frq]);

  return (
    <div className="mx-auto max-w-4xl space-y-10 p-8">
      <section>
        <h2 className="mb-3 text-2xl font-bold">Editor — Free Response question</h2>
        <QuestionsInputInterface questions={questions} setQuestions={setQuestions} />
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-bold">Practice box — single FRQ</h2>
        <CheckForUnderstanding questionInstance={frq} />
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-bold">Quiz — mixed MCQ + FRQ</h2>
        <QuizRenderer questions={[mcq, frq]} />
      </section>
    </div>
  );
}
