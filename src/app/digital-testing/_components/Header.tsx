import React from 'react';
import ToolsDropdown from './ToolsDropdown'; 
import styles from '../styles/Header.module.css';

const Header: React.FC = () => {
  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.examInfo}>
          <span>AP Calculus Exam</span>
          <span>Module 1</span>
        </div>
        <div className={styles.timer}>00:45:00</div>
        <div className={styles.userInfo}>
          <text>John Doe</text> 
          <text>ID: 123456</text>
        </div>
        <ToolsDropdown /> {/* SWITCH TO ACTUAL TOOLS */}
      </div>
    </header>
  );
};

export default Header;
