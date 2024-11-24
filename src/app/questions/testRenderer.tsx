"use client";

import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import Header from "./digital-testing/_components/Header";
import QuestionPanel from "./digital-testing/_components/QuestionPanel";
import Footer from "./digital-testing/_components/Footer";
import type { QuestionFormat } from "@/types/questions";
import { RenderContent } from "../article-creator/_components/custom_questions/RenderAdvancedTextbox";
import Highlighter, {
  type Highlight,
} from "./digital-testing/_components/Highlighter";
import ReviewPage from "./digital-testing/_components/ReviewPage";
import clsx from "clsx";

interface Props {
  inputQuestions: QuestionFormat[];
  time: number;
  testName: string;
  adminMode?: boolean;
}

const initialQuestions: QuestionFormat[] = [
  {
    question: { value: "What is the capital of France?" },
    type: "mcq",
    options: [
      { id: "1", value: { value: "Paris" } },
      { id: "2", value: { value: "London" } },
      { id: "3", value: { value: "Rome" } },
      { id: "4", value: { value: "Berlin" } },
    ],
    answers: ["Paris"],
    explanation: { value: "Paris is the capital city of France." },
    content: {
      value:
        "Paris is the capital city of France. (EXAMPLE article or document)",
    },
    bookmarked: false,
  },
  {
    question: { value: "What is the capital of Japan?" },
    type: "mcq",
    options: [
      { id: "1", value: { value: "Tokyo" } },
      { id: "2", value: { value: "Kyoto" } },
      { id: "3", value: { value: "Osaka" } },
      { id: "4", value: { value: "Hiroshima" } },
    ],
    answers: ["Tokyo"],
    explanation: { value: "Tokyo is the capital city of Japan." },
    content: {
      value:
        "Tokyo is the capital city of Japan. (EXAMPLE article or document)",
    },
    bookmarked: false,
  },
];

export default function DigitalTestingPage({
  time,
  testName,
  inputQuestions,
  adminMode = false,
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
  const [questionHighlights, setQuestionHighlights] = useState<Highlight[][]>(
    initialQuestions.map(() => []),
  );

  const [showEliminationTools, setShowEliminationTools] = useState(false);
  const [submittedAnswers, setSubmittedAnswers] = useState(false);
  const [showReviewPage, setShowReviewPage] = useState(false);
  // const [showTools, setShowTools] = useState(false);

  useEffect(() => {
    setQuestions(inputQuestions);
  }, [inputQuestions]);

  // Track highlights for all --- uses index as key to corrospond to question, and array to hold highlights (might need to move to Highlighter file)
  const handleContentHighlights = (newHighlights: Highlight[]) => {
    const updatedHighlights = [...contentHighlights];
    updatedHighlights[currentQuestionIndex] = newHighlights;
    setContentHighlights(updatedHighlights);
  };

  const handleQuestionHighlights = (newHighlights: Highlight[]) => {
    const updatedHighlights = [...questionHighlights];
    updatedHighlights[currentQuestionIndex] = newHighlights;
    setQuestionHighlights(updatedHighlights);
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
            : [...(prev[currentQuestionIndex] || []), optionId],
    }));
  };

  return (
    <div className="flex h-screen flex-col">
      {!adminMode && (
        <Header
          setSubmittedAnswers={setSubmittedAnswers}
          examName={testName}
          timeRemaining={time * 60}
        />
      )}
      {showReviewPage && !submittedAnswers ? (
        <ReviewPage
          goToQuestion={setCurrentQuestionIndex}
          currentQuestionIndex={currentQuestionIndex}
          questions={questions}
          selectedAnswers={selectedAnswers}
        />
      ) : (
        <div className="flex flex-1 overflow-hidden pt-[52px]">
          {/* If there isn't content on the left, don't show left panel */}
          {questions[currentQuestionIndex]!.content && (
            <div className="flex-1">
              <div className="mr-2 mt-4">
                <Highlighter
                  questionIndex={currentQuestionIndex}
                  highlights={contentHighlights[currentQuestionIndex]!}
                  onUpdateHighlights={handleContentHighlights}
                >
                  <RenderContent
                    content={questions[currentQuestionIndex]!.content!}
                  />
                </Highlighter>
              </div>
            </div>
          )}
          <div className="flex h-fit flex-1 flex-col border-l-2 border-gray-300 p-5">
            <div className="flex h-9 items-center gap-2 bg-gray-200">
              <p className="flex h-full items-center bg-black px-3.5 text-lg font-bold tabular-nums text-white">
                {currentQuestionIndex + 1}
              </p>
              <button className="flex" onClick={toggleBookmark}>
                {questions[currentQuestionIndex]!.bookmarked ? (
                  <>
                    <Bookmark className="mr-1 inline fill-black" /> Bookmarked
                  </>
                ) : (
                  <>
                    <Bookmark className="mr-1 inline fill-white" /> Mark for
                    Review
                  </>
                )}
              </button>

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
                    x="4"
                    y="12"
                    fontFamily="Arial, sans-serif"
                    fontSize="6"
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
            </div>
            <Highlighter
              questionIndex={currentQuestionIndex}
              highlights={questionHighlights[currentQuestionIndex]!}
              onUpdateHighlights={handleQuestionHighlights}
            >
              <QuestionPanel
                showEliminationTools={showEliminationTools}
                questionInstance={questions[currentQuestionIndex]}
                selectedAnswers={selectedAnswers[currentQuestionIndex] || []}
                onSelectAnswer={handleSelectAnswer}
                currentQuestionIndex={currentQuestionIndex}
                questionsLength={questions.length}
                submittedAnswers={submittedAnswers}
              />
            </Highlighter>
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
        setSubmittedAnswers={setSubmittedAnswers}
      />
    </div>
  );
}
