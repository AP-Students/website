import React from 'react';
import styles from '../styles/navigationPanel.module.css';

interface NavigationPanelProps {
  questionNumbers: number[];
  currentQuestionIndex: number;
  onQuestionSelect: (index: number) => void;
}

const NavigationPanel: React.FC<NavigationPanelProps> = ({ questionNumbers, currentQuestionIndex, onQuestionSelect }) => {
  return (
    <div className={styles.navigationPanel}>
      {questionNumbers.map((num, index) => (
        <button
          key={index}
          className={`${styles.questionButton} ${currentQuestionIndex === index ? styles.active : ''}`}
          onClick={() => onQuestionSelect(index)}
        >
          {num}
        </button>
      ))}
    </div>
  );
};

export default NavigationPanel;
