import React from 'react';
import styles from '../styles/Footer.module.css';
interface FooterProps {
  onNext: () => void;
  onPrevious: () => void;
  onReview: () => void;
  progress: string;
}

const Footer: React.FC<FooterProps> = ({ onNext, onPrevious, onReview, progress }) => {
  return (
    <footer className={styles.footer}>
      <div className={styles.progress}>{progress}</div>
      <div className={styles.controls}>
        <button className={styles.button} onClick={onPrevious}>Previous</button>
        <button className={styles.button} onClick={onNext}>Next</button>
        <button className={styles.reviewButton} onClick={onReview}>Review</button>
      </div>
    </footer>
  );
};

export default Footer;
