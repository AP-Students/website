"use client";

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
  currentQuestionIndex: number; // To track which question to display
}


const QuestionRenderer: React.FC<Props> = ({ questions, currentQuestionIndex }) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const question = questions[currentQuestionIndex]!;

  const handleSelectOption = (id: string) => {
    if (question.type === 'mcq') {
      setSelectedOptions([id]);
    } else {
      setSelectedOptions(prev => 
        prev.includes(id) ? prev.filter(optionId => optionId !== id) : [...prev, id]
      );
    }
  };

  return (
    <div className='p-4 md:p-6 lg:p-8 max-w-5xl'>
      <div className="text-2xl lg:text-3xl font-bold markdown" dangerouslySetInnerHTML={{ __html: question.body }} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {question.options.map(option => (
          <button
            key={option.id}
            className={`flex items-center justify-center rounded-lg border border-primary py-4 md:py-5 lg:py-6 lg:text-lg ${selectedOptions.includes(option.id) ? 'bg-blue-200' : 'bg-zinc-50'}`}
            onClick={() => handleSelectOption(option.id)}
          >
            {option.value}
          </button>
        ))}
      </div>
      
    </div>
  );
};

export default QuestionRenderer;
