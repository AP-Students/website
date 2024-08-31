// src/app/digital-testing/_components/ToolsDropdown.tsx
import React, { useState } from 'react';
import styles from '../styles/ToolsDropdown.module.css';
import { FaEllipsisV } from 'react-icons/fa'; // Assuming you have react-icons installed

const ToolsDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);

  return (
    <div className={styles.toolsDropdown}>
      <button className={styles.moreButton} onClick={toggleDropdown}>
        <FaEllipsisV />
      </button>
      {isOpen && (
        <div className={styles.dropdownMenu}>
          <button className={styles.dropdownItem}>Calculator</button>
          <button className={styles.dropdownItem}>Notes</button>
          <button className={styles.dropdownItem}>Highlighter</button>
          <button className={styles.dropdownItem}>Elimination Tool</button>
        </div>
      )}
    </div>
  );
};

export default ToolsDropdown;