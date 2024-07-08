"use client"
import React, { useState } from 'react';
import ArticleEditor from '../_components/ArticleEditor'; 

const EditArticlePage: React.FC = () => {
  const [content, setContent] = useState<string>('');

  const handleSubmit = () => {
    console.log('Article submitted:', content);
    // PLACEHOLDER Function. "content" variable contains article content in Markdown format. Can be pushed to database and used for Article Renderer. 
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4 text-center">AP(roject) Article Editor</h1>
      <p className='text-center'>Write your article for AP(roject). Provide clear, comprehensive explanations, helpful tips and advice, and positive motivation. Once you're done, click Submit to make your article public!</p>
      <ArticleEditor content={content} onChange={setContent} onSubmit={handleSubmit} />
    </div>
  );
};

export default EditArticlePage;





