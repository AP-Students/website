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
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const [submitted, setSubmitted] = useState<boolean>(false);

  const question = questions[currentQuestionIndex]!;

  const handleSelectOption = (id: string) => {
    if (!submitted) {
      if (question.type === 'mcq') {
        setSelectedOptions([id]);  // Ensure only one option can be selected at a time
      } else {
        setSelectedOptions(prev =>
          prev.includes(id) ? prev.filter(optionId => optionId !== id) : [...prev, id]
        );  // Toggle selection for multi-answer
      }
    }
  };
  

  const handleSubmit = () => {
    if (selectedOptions.length > 0) {
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
            ${submitted ? (
              isCorrect(option.id) ?
                (selectedOptions.includes(option.id) ? 'bg-green-300 border-green-700' : 'bg-green-100 border-green-700') :
                (selectedOptions.includes(option.id) ? 'bg-red-300 border-red-700' : 'border-gray-300')
            ) :
              (selectedOptions.includes(option.id) ? 'bg-blue-100 border-blue-500' : 'bg-zinc-50 border-black')}
            `}
          onClick={() => handleSelectOption(option.id)}
          disabled={submitted}
        >
          {option.value}
        </button>
        ))}
      </div>
      {!submitted && (
        <button className="block mx-auto mt-4 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={handleSubmit}>
          Submit
        </button>
      )}
    </div>
  );
};

export default QuestionRenderer;
