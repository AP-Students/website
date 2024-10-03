import React from 'react';
import { OutputData } from '@editorjs/editorjs';

interface ArticleComponentProps {
  content: OutputData;
}

const ArticleComponent: React.FC<ArticleComponentProps> = ({ content }) => {
  return (
    <div className="p-5 bg-white overflow-y-auto h-[calc(100vh-52px-70px)]">
      {/* Render the article content here */}
      <div dangerouslySetInnerHTML={{ __html: content.blocks.map(block => block.data.text).join('<br/>') }} />
    </div>
  );
};

export default ArticleComponent;
