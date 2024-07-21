// src/app/digital-testing/_components/QuestionPanel.tsx
import React, { useState } from 'react';
import styles from '../styles/QuestionPanel.module.css';

interface QuestionPanelProps {
  question: string;
  options: string[];
  attachments: any[];
}

const QuestionPanel: React.FC<QuestionPanelProps> = ({ question, options }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(event.target.value);
  };

  return (
    <div className={styles.questionPanel}>
      <div className={styles.questionText}>{question}</div>
      <div className={styles.options}>
        {options.map((option, index) => (
          <div key={index} className={styles.optionBox}>
            <input
              type="radio"
              id={`option-${index}`}
              name="options"
              value={option}
              checked={selectedOption === option}
              onChange={handleOptionChange}
              className={styles.optionInput}
            />
            <label htmlFor={`option-${index}`} className={styles.optionLabel}>
              {option}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionPanel;
