"use client";
import React, { useState } from "react";
import Header from "./_components/Header";
import ArticleComponent from "./_components/ArticleComponent";
import QuestionPanel from "./_components/QuestionPanel";
import ToolsDropdown from "./_components/ToolsDropdown";
import Footer from "./_components/Footer";
import { OutputData } from "@editorjs/editorjs";

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
const questions = [
  {
    question: "What is the capital of France?",
    options: ["Paris", "London", "Rome", "Berlin"],
    answer: "",
  },
  {
    question: "What is the capital of Japan?",
    options: ["Tokyo", "Kyoto", "Osaka", "Hiroshima"],
    answer: "",
  },
  // SHOULD BE DYNAMIC > GET FROM DATABASE
];

const DigitalTestingPage: React.FC = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
  const [showTools, setShowTools] = useState(false);

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      if (currentArticleIndex < sampleArticles.length - 1) {
        setCurrentArticleIndex(currentArticleIndex + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      if (currentArticleIndex > 0) {
        setCurrentArticleIndex(currentArticleIndex - 1);
      }
    }
  };

  const handleReview = () => {
    // Implement "Mark for Review"
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
          <ArticleComponent content={sampleArticles[currentArticleIndex]} />
        </div>
        <div className="flex flex-1 flex-col p-5">
          <QuestionPanel
            question={questions[currentQuestionIndex].question}
            options={questions[currentQuestionIndex].options}
            attachments={[]}
          />
        </div>
      </div>
      <Footer
        onNext={handleNext}
        onPrevious={handlePrevious}
        onReview={handleReview}
        progress={`Question ${currentQuestionIndex + 1} of ${questions.length}`}
      />
    </div>
  );
};

export default DigitalTestingPage;
