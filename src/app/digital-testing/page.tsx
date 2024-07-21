"use client";
import React, { useState } from 'react';
import Header from './_components/Header';
import ArticleComponent from './_components/ArticleComponent'; // Updated import
import QuestionPanel from './_components/QuestionPanel';
import ToolsDropdown from './_components/ToolsDropdown'; // Updated import
import Footer from './_components/Footer';
import { OutputData } from '@editorjs/editorjs';
import styles from './styles/page.module.css';

// Random sample articles
const sampleArticles: OutputData[] = [
  {
    blocks: [
      {
        type: 'paragraph',
        data: {
          text: 'Paris is the capital city of France. (EXAMPLE article or document)',
        },
      },
    ],
  },
  {
    blocks: [
      {
        type: 'paragraph',
        data: {
          text: 'Tokyo is the capital city of Japan. (EXAMPLE article or document)',
        },
      },
    ],
  }
  // SHOULD BE DYNAMIC > GET FROM DATABASE
];

// RANDOM SAMPLE QUESTION
const questions = [
  {
    question: "What is the capital of France?",
    options: ["Paris", "London", "Rome", "Berlin"],
    answer: ""
  },
  {
    question: "What is the capital of Japan?",
    options: ["Tokyo", "Kyoto", "Osaka", "Hiroshima"],
    answer: ""
  }
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
    <div className={styles.page}>
      <Header />
      <ToolsDropdown isVisible={showTools} onClose={() => setShowTools(false)} />
      <div className={styles.content}>
        <div className={styles.leftColumn}>
          <ArticleComponent content={sampleArticles[currentArticleIndex]} />
        </div>
        <div className={styles.rightColumn}>
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
