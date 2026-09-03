"use client";

import { useEffect, useState } from "react";
import { Bookmark, Check, X } from "lucide-react";
import Header from "./digital-testing/Header";
import QuestionPanel from "./digital-testing/QuestionPanel";
import Footer from "./digital-testing/Footer";
import type { QuestionFormat } from "@/types/questions";
import type { ReferenceSheet } from "@/types/firestore";
import { RenderContent } from "../../components/article-creator/custom_questions/RenderAdvancedTextbox";
import Highlighter, { type Highlight } from "./digital-testing/Highlighter";
import ReviewPage, { isQuestionCorrect } from "./digital-testing/ReviewPage";
import CompletionPage from "./digital-testing/CompletionPage";
import clsx from "clsx";
import { cn } from "@/lib/utils";
import "katex/dist/katex.min.css";

interface Props {
  inputQuestions: QuestionFormat[];
  time: number;
  adminMode?: boolean;
  directions?: string;
  testName: string;
  /** Whether this test has a reference sheet assigned, regardless of whether it loaded. */
  referenceSheetEnabled?: boolean;
  /** The resolved sheet, or null if enabled but unavailable (deleted, fetch error). */
  referenceSheet?: ReferenceSheet | null;
}

const initialQuestions: QuestionFormat[] = [
  {
    question: { value: "What is the capital of France?", files: [] },
    type: "mcq",
    options: [
      { id: "1", value: { value: "Paris", files: [] } },
      { id: "2", value: { value: "London", files: [] } },
      { id: "3", value: { value: "Rome", files: [] } },
      { id: "4", value: { value: "Berlin", files: [] } },
    ],
    answers: ["Paris"],
    explanation: { value: "Paris is the capital city of France.", files: [] },
    content: {
      value:
        "Paris is the capital city of France. (EXAMPLE article or document)",
      files: [],
    },
    bookmarked: false,
    topic: "1.1",
  },
  {
    question: { value: "What is the capital of Japan?", files: [] },
    type: "mcq",
    options: [
      { id: "1", value: { value: "Tokyo", files: [] } },
      { id: "2", value: { value: "Kyoto", files: [] } },
      { id: "3", value: { value: "Osaka", files: [] } },
      { id: "4", value: { value: "Hiroshima", files: [] } },
    ],
    answers: ["Tokyo"],
    explanation: { value: "Tokyo is the capital city of Japan.", files: [] },
    content: {
      value:
        "Tokyo is the capital city of Japan. (EXAMPLE article or document)",
      files: [],
    },
    bookmarked: false,
    topic: "1.2",
  },
];

export default function DigitalTestingPage({
  time,
  inputQuestions,
  adminMode = false,
  directions,
  testName,
  referenceSheetEnabled = false,
  referenceSheet,
}: Props) {
  const [questions, setQuestions] = useState<QuestionFormat[]>(
    inputQuestions || initialQuestions,
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, string[]>
  >({});

  const [contentHighlights, setContentHighlights] = useState<Highlight[][]>(
    initialQuestions.map(() => []),
  );

  const [showEliminationTools, setShowEliminationTools] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showReviewPage, setShowReviewPage] = useState(false);
  const [showCompletionPage, setShowCompletionPage] = useState(false);

  useEffect(() => {
    setQuestions(inputQuestions);
  }, [inputQuestions]);

  const handleSetSubmitted = (value: boolean) => {
    // Header unmounts while the completion page is up, so continuing on to the
    // results remounts it with a fresh countdown. Ignore repeat submits so that
    // restarted timer can't drag the user back to the completion page.
    if (value && submitted) return;
    setSubmitted(value);
    if (value && !adminMode) setShowCompletionPage(true);
  };

  // Track highlights for all --- uses index as key to corrospond to question, and array to hold highlights (might need to move to Highlighter file)
  const handleContentHighlights = (newHighlights: Highlight[]) => {
    const updatedHighlights = [...contentHighlights];
    updatedHighlights[currentQuestionIndex] = newHighlights;
    setContentHighlights(updatedHighlights);
  };

  const toggleBookmark = () => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[currentQuestionIndex]) {
      updatedQuestions[currentQuestionIndex] = {
        ...updatedQuestions[currentQuestionIndex],
        bookmarked: !updatedQuestions[currentQuestionIndex].bookmarked,
      };
      setQuestions(updatedQuestions);
    }
    setQuestions(updatedQuestions);
  };

  const handleSelectAnswer = (optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]:
        questions[currentQuestionIndex]!.type === "mcq"
          ? [optionId]
          : prev[currentQuestionIndex]?.includes(optionId)
            ? prev[currentQuestionIndex].filter((id) => id !== optionId)
            : [...(prev[currentQuestionIndex] ?? []), optionId],
    }));
  };

  if (showCompletionPage && !adminMode) {
    return (
      <CompletionPage
        onContinue={() => {
          setShowCompletionPage(false);
          setShowReviewPage(true);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col">
      {!adminMode && (
        <Header
          setSubmitted={handleSetSubmitted}
          submitted={submitted}
          timeRemaining={time * 60}
          directions={directions}
          referenceSheetEnabled={referenceSheetEnabled}
          referenceSheet={referenceSheet}
        />
      )}
      {showReviewPage ? (
        <ReviewPage
          goToQuestion={setCurrentQuestionIndex}
          currentQuestionIndex={currentQuestionIndex}
          questions={questions}
          selectedAnswers={selectedAnswers}
          setShowReviewPage={setShowReviewPage}
          submitted={submitted}
        />
      ) : (
        <div className="flex flex-1 overflow-hidden pt-8">
          {/* If there isn't content on the left, don't show left panel */}
          {questions.length > 0 &&
            (questions[currentQuestionIndex]!.content.value.trim() ||
              questions[currentQuestionIndex]!.content.files.length > 0) && (
              <div className="mr-5 h-[calc(100vh-170px)] flex-1 overflow-y-auto border-2 border-gray-300 px-4 py-2">
                <Highlighter
                  questionIndex={currentQuestionIndex}
                  highlights={contentHighlights[currentQuestionIndex]!}
                  onUpdateHighlights={handleContentHighlights}
                >
                  <RenderContent
                    content={questions[currentQuestionIndex]!.content}
                    origin="content"
                  />
                </Highlighter>
              </div>
            )}
          <div
            className={cn(
              "flex h-[calc(100vh-170px)] flex-1 flex-col overflow-y-auto p-5",
              questions.length > 0 &&
                !(
                  questions[currentQuestionIndex]!.content.value.trim() ||
                  questions[currentQuestionIndex]!.content.files.length > 0
                ) &&
                "mx-auto max-w-4xl",
            )}
          >
            <div className="flex h-9 items-center gap-2 bg-gray-200">
              <p className="flex h-full items-center bg-black px-3.5 text-lg font-bold tabular-nums text-white">
                {currentQuestionIndex + 1}
              </p>

              {!submitted ? (
                <button className="flex" onClick={toggleBookmark}>
                  {questions.length > 0 &&
                  questions[currentQuestionIndex]!.bookmarked ? (
                    <>
                      <Bookmark className="mr-1 fill-black" /> Bookmarked
                    </>
                  ) : (
                    <>
                      <Bookmark className="mr-1 fill-white" /> Mark for Review
                    </>
                  )}
                </button>
              ) : isQuestionCorrect(
                  questions[currentQuestionIndex]!,
                  selectedAnswers[currentQuestionIndex] ?? [],
                ) ? (
                <Check className="stroke-green-500 stroke-[3px]" />
              ) : (
                <X className="stroke-red-500 stroke-[3px]" />
              )}

              {submitted && questions[currentQuestionIndex]!.topic && (
                <span className="ml-auto pr-2">
                  Topic: {questions[currentQuestionIndex]!.topic}
                </span>
              )}

              {!submitted && (
                <button
                  onClick={() => setShowEliminationTools(!showEliminationTools)}
                  className="ml-auto p-1"
                  title="Eliminate options"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="25"
                    height="25"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <rect
                      className={clsx(showEliminationTools && "fill-white")}
                      x="1"
                      y="1"
                      width="18"
                      height="18"
                      rx="2"
                      ry="2"
                      stroke="#000"
                      strokeWidth="1"
                    />
                    <text
                      x="2"
                      y="13"
                      fontFamily="Arial, sans-serif"
                      fontSize="7"
                      fontWeight="bold"
                      fill="#000"
                    >
                      ABC
                    </text>
                    <line
                      x1="3"
                      y1="3"
                      x2="17"
                      y2="17"
                      stroke="#000"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              )}
            </div>
            <QuestionPanel
              showEliminationTools={showEliminationTools}
              questionInstance={questions[currentQuestionIndex]}
              selectedAnswers={selectedAnswers[currentQuestionIndex] ?? []}
              onSelectAnswer={handleSelectAnswer}
              currentQuestionIndex={currentQuestionIndex}
              questionsLength={questions.length}
              submitted={submitted}
            />
          </div>
        </div>
      )}
      <Footer
        goToQuestion={setCurrentQuestionIndex}
        currentQuestionIndex={currentQuestionIndex}
        setCurrentQuestionIndex={setCurrentQuestionIndex}
        questions={questions}
        selectedAnswers={selectedAnswers}
        setShowReviewPage={setShowReviewPage}
        showReviewPage={showReviewPage}
        setSubmitted={handleSetSubmitted}
        submitted={submitted}
        adminMode={adminMode}
        testName={testName}
      />
    </div>
  );
}
