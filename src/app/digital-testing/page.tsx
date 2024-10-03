"use client";
import React, { useState } from "react";
import Header from "./_components/Header";
import ArticleComponent from "./_components/ArticleComponent";
import QuestionPanel from "./_components/QuestionPanel";
import ToolsDropdown from "./_components/ToolsDropdown";
import Footer from "./_components/Footer";
import { OutputData } from "@editorjs/editorjs";
import { Bookmark } from "lucide-react";

// Random sample articles
const sampleArticles: OutputData[] = [
  {
    blocks: [
      {
        type: "paragraph",
        data: {
          text: "Paris is the capital city of France. (EXAMPLE article or document)",
        },
      },
    ],
  },
  {
    blocks: [
      {
        type: "paragraph",
        data: {
          text: "Tokyo is the capital city of Japan. (EXAMPLE article or document)",
        },
      },
    ],
  },
  // SHOULD BE DYNAMIC > GET FROM DATABASE
];

// RANDOM SAMPLE QUESTION
export interface Question {
  documentIndex: number;
  statement: string;
  options: string[];
  answer: string;
  bookmarked: boolean;
  selected: number | null;
}

const questionsData: Question[] = [
  {
    documentIndex: 0,
    statement: "What is the capital of France?",
    options: ["Paris", "London", "Rome", "Berlin"],
    answer: "",
    bookmarked: false,
    selected: null,
  },
  {
    documentIndex: 1,
    statement: "What is the capital of Japan?",
    options: ["Tokyo", "Kyoto", "Osaka", "Hiroshima"],
    answer: "",
    bookmarked: false,
    selected: null,
  },
  // SHOULD BE DYNAMIC > GET FROM DATABASE
];

const DigitalTestingPage: React.FC = () => {
  const [questions, setQuestions] = useState(questionsData);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showTools, setShowTools] = useState(false);

  const saveSelection = (selected: number | null) => {
    questions[currentQuestionIndex]!.selected = selected;
    setQuestions([...questions]);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const toggleBookmark = () => {
    questions[currentQuestionIndex]!.bookmarked =
      !questions[currentQuestionIndex]!.bookmarked;
    setQuestions([...questions]);
  };

  const toggleTools = () => {
    setShowTools(!showTools);
  };

  return (
    <div className="flex h-screen flex-col">
      <Header
        examName="AP Calculus Exam"
        moduleName="Module 1"
        timeRemaining={45 * 60}
      />
      <div className="flex flex-1 overflow-hidden pt-[52px]">
        <div className="flex-1 overflow-y-auto border-r-2 border-gray-300">
          <ArticleComponent
            content={
              sampleArticles[questions[currentQuestionIndex]!.documentIndex]
            }
          />
        </div>
        <div className="flex flex-1 flex-col p-5">
          <div className="flex h-9 items-center gap-2 bg-gray-200">
            <p className="flex h-full items-center bg-black px-3.5 text-lg font-bold tabular-nums text-white">
              {currentQuestionIndex + 1}
            </p>
            <button className="flex" onClick={toggleBookmark}>
              {questions[currentQuestionIndex]?.bookmarked ? (
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
          </div>
          <QuestionPanel
            question={questions[currentQuestionIndex]!}
            attachments={[]}
            saveSelection={saveSelection}
          />
        </div>
      </div>
      <Footer
        onNext={handleNext}
        onPrevious={handlePrevious}
        goToQuestion={setCurrentQuestionIndex}
        currentQuestionIndex={currentQuestionIndex}
        questions={questions}
      />
    </div>
  );
};

export default DigitalTestingPage;
