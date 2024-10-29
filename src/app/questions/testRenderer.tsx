'use client'

import { useState } from 'react'
import { Bookmark } from 'lucide-react'
import Header from './digital-testing/_components/Header'
import QuestionPanel from './digital-testing/_components/QuestionPanel'
import Footer from './digital-testing/_components/Footer'
import type { QuestionFormat } from '@/types/questions'
import { RenderContent } from '../article-creator/_components/custom_questions/RenderAdvancedTextbox'

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
      value: "Paris is the capital city of France. (EXAMPLE article or document)",
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
      value: "Tokyo is the capital city of Japan. (EXAMPLE article or document)",
    },
    bookmarked: false,
  },
]

export default function DigitalTestingPage() {
  const [questions, setQuestions] = useState<QuestionFormat[]>(initialQuestions)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string[]>>({})
  const [showTools, setShowTools] = useState(false)

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const toggleBookmark = () => {
    const updatedQuestions = [...questions]
    if (updatedQuestions[currentQuestionIndex]) {
      updatedQuestions[currentQuestionIndex] = {
        ...updatedQuestions[currentQuestionIndex],
        bookmarked: !updatedQuestions[currentQuestionIndex].bookmarked
      }
      setQuestions(updatedQuestions)
    }
    setQuestions(updatedQuestions)
  }

  const handleSelectAnswer = (optionId: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: questions[currentQuestionIndex]!.type === 'mcq' 
        ? [optionId]
        : prev[currentQuestionIndex]?.includes(optionId)
          ? prev[currentQuestionIndex].filter(id => id !== optionId)
          : [...(prev[currentQuestionIndex] || []), optionId]
    }))
  }

  return (
    <div className="flex h-screen flex-col">
      <Header examName="AP Calculus Exam" moduleName="Module 1" timeRemaining={45 * 60} />
      <div className="flex flex-1 overflow-hidden pt-[52px]">
        <div className="flex-1">
          <div className="mt-4 mr-2">
            <RenderContent content={questions[currentQuestionIndex]!.content!} />
          </div>
        </div>
        <div className="flex flex-1 flex-col p-5 border-l-2 border-gray-300 h-fit">
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
                  <Bookmark className="mr-1 inline fill-white" /> Mark for Review
                </>
              )}
            </button>
          </div>
          <QuestionPanel
            questionInstance={questions[currentQuestionIndex]}
            selectedAnswers={selectedAnswers[currentQuestionIndex] || []}
            onSelectAnswer={handleSelectAnswer}
          />
        </div>
      </div>
      <Footer
        onNext={handleNext}
        onPrevious={handlePrevious}
        goToQuestion={setCurrentQuestionIndex}
        currentQuestionIndex={currentQuestionIndex}
        questions={questions}
        selectedAnswers={selectedAnswers}
      />
    </div>
  )
}