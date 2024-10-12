import React from 'react';
import styles from '../styles/frqComponent.module.css';

interface FRQComponentProps {
  question: string;
  answer: string;
  onAnswerChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const FRQComponent: React.FC<FRQComponentProps> = ({ question, answer, onAnswerChange }) => {
  return (
    <div className={styles.frqComponent}>
      <div className={styles.questionText}>{question}</div>
      <textarea
        className={styles.answerArea}
        value={answer}
        onChange={onAnswerChange}
        placeholder="Type your answer here..."
      />
    </div>
  );
};

export default FRQComponent;
