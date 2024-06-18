"use client";
import React, { useState } from 'react';

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleFAQ = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="w-11/12 sm:w-4/5 mx-auto pt-4 pb-7 border-b text-black">
      <button
        onClick={toggleFAQ}
        className="w-full text-left text-2xl lg:text-3xl flex justify-between items-center py-2"
      >
        {question}
        <span>{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div className="mt-2 text-lg lg:text-xl text-gray-700">
          {answer}
        </div>
      )}
    </div>
  );
};

export default FAQItem;
