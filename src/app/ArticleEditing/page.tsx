"use client"
import React, { useState } from 'react';
import ArticleEditor from './_components/ArticleEditor';

const EditArticlePage = () => {
  const [content, setContent] = useState<string>('');

  const handleChange = (newContent: string) => {
    console.log(newContent)
    setContent(newContent);
  };

  const handleSubmit = () => {
    console.log('Article content:', content);
    // PLACEHOLDER. "content" variable contains article content in Markdown. Can store in database and use in Article Renderer. 
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-bold mb-4">Write your Article</h1>
      <p>Write the article below and hit Submit to publish.</p>
      <ArticleEditor content={content} onChange={handleChange} onSubmit={handleSubmit} />
    </div>
  );
};

export default EditArticlePage;
