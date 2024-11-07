'use client'

import { useState } from 'react'
import { MapPin, Bookmark, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface QuestionNavigationProps {
  totalQuestions?: number
  currentQuestion?: number
  answeredQuestions?: number[]
  bookmarkedQuestions?: number[]
  onQuestionSelect?: (questionNumber: number) => void
  onClose?: () => void
}

export default function Component({
  // This shit shold be dynamic
  totalQuestions = 27,
  currentQuestion = 10,
  answeredQuestions = [1, 2, 3, 5, 6, 7, 8, 9],
  bookmarkedQuestions = [6],
  onQuestionSelect = () => {},
  onClose = () => {},
}: QuestionNavigationProps) {
  const [isOpen, setIsOpen] = useState(true)

  const handleClose = () => {
    setIsOpen(false)
    onClose()
  }

  const handleQuestionClick = (questionNumber: number) => {
    onQuestionSelect(questionNumber)
    setIsOpen(false)
  }

  return (
    <>
      <Button
        variant="outline"
        className="flex items-center gap-2"
        onClick={() => setIsOpen(true)}
      >
        Question {currentQuestion} of {totalQuestions}
        <ChevronDown className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <div className="relative p-6">
            <button
              onClick={handleClose}
              className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>

            <h2 className="mb-6 text-center text-xl font-semibold">
              Section 1, Module 1: Reading and Writing Questions
            </h2>

            <div className="mb-6 flex justify-center gap-8 border-b border-t py-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>Current</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded border-2 border-dashed border-gray-400"></div>
                <span>Unanswered</span>
              </div>
              <div className="flex items-center gap-2">
                <Bookmark className="h-5 w-5 fill-current" />
                <span>For Review</span>
              </div>
            </div>

            <div className="mb-8 grid grid-cols-10 gap-2">
              {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((number) => (
                <button
                  key={number}
                  onClick={() => handleQuestionClick(number)}
                  className={`relative flex h-10 w-10 items-center justify-center rounded ${
                    answeredQuestions.includes(number)
                      ? 'bg-blue-500 text-white'
                      : 'border-2 border-dashed border-gray-400 text-blue-500'
                  }`}
                >
                  {number}
                  {bookmarkedQuestions.includes(number) && (
                    <Bookmark className="absolute -right-2 -top-2 h-4 w-4 fill-red-500 text-red-500" />
                  )}
                  {number === currentQuestion && (
                    <MapPin className="absolute -right-2 -top-2 h-4 w-4" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex justify-center">
              <Button
                variant="outline"
                className="rounded-full px-8"
                onClick={() => setIsOpen(false)}
              >
                Go to Review Page
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}