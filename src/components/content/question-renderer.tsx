"use client"
import React, { useState } from 'react';

interface Option {
  value: string;
  id: string;
}

interface QuestionFormat {
  body: string;
  title: string;
  type: 'mcq' | 'multi-answer';
  options: Option[];
  correct: string[];
  course_id: string;
  unit_ids: string[];
  subunit_ids: string[];
}

interface Props {
  questions: QuestionFormat[];
  currentQuestionIndex: number;
}

const QuestionRenderer: React.FC<Props> = ({ questions, currentQuestionIndex }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const question = questions[currentQuestionIndex]!;

  const handleSelectOption = (id: string) => {
    if (!submitted && question.type === 'mcq') {
      setSelectedOption(id);
    }
  };

  const handleSubmit = () => {
    if (selectedOption) {
      setSubmitted(true);
    }
  };

  const isCorrect = (id: string) => {
    return question.correct.includes(id);
  };

  return (
    <div className='p-4 md:p-6 lg:p-8 max-w-5xl'>
      <div className="text-2xl font-bold markdown" dangerouslySetInnerHTML={{ __html: question.body }} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {question.options.map(option => (
          <button
          key={option.id}
          className={`flex items-center justify-center rounded-lg py-4 px-6 border
            ${submitted ?
              (isCorrect(option.id) ?
                'bg-green-300 border-green-700' : // Correct option after submission
                selectedOption === option.id ?
                'bg-red-300 border-red-700' : // Incorrectly selected option
                'border-gray-300') : // Other options
              selectedOption === option.id ?
              'bg-blue-100 border-blue-500' : // Selected but not yet submitted
              'bg-zinc-50 border-black' // Not selected
            }`}
          onClick={() => handleSelectOption(option.id)}
          disabled={submitted}
        >
          {option.value}
        </button>
        ))}
      </div>
      {!submitted && (
        <button className="block mx-auto mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600" onClick={handleSubmit}>
          Submit
        </button>
      )}
    </div>
  );
};

export default QuestionRenderer;
