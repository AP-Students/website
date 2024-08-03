// src/app/digital-testing/_components/ArticleComponent.tsx
import React from 'react';
import { OutputData } from '@editorjs/editorjs';
import styles from '../styles/ArticleComponent.module.css';

interface ArticleComponentProps {
  content: OutputData;
}

const ArticleComponent: React.FC<ArticleComponentProps> = ({ content }) => {
  return (
    <div className={styles.article}>
      {/* Render the article content here */}
      <div dangerouslySetInnerHTML={{ __html: content.blocks.map(block => block.data.text).join('<br/>') }} />
    </div>
  );
};

export default ArticleComponent;
