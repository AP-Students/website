"use client"
import React, { useState } from 'react';
import ArticleEditor from '../components/ArticleEditor';
import html2md from 'html-to-md'

const EditArticlePage = () => {
  const [content, setContent] = useState<string>('');

  const handleSubmit = () => {
    const markdownContent = html2md(content).replace(/<u>(.*?)<\/u>/g, '__$1__');;
    console.log(markdownContent);
  };

  return (
    <div className="mx-auto max-w-3xl p-6 bg-white text-black shadow-lg border border-gray-300">
      <h1 className="text-4xl font-bold mb-6 text-center">AP(roject) Article Editor</h1>
      <p className="text-lg mb-4 text-center">
        Write your article for AP(roject). Provide clear, comprehensive explanations, helpful tips and advice, and positive motivation. Once you're done, click Publish to make your article public      
      </p>
      <ArticleEditor content={content} onChange={setContent} onSubmit={handleSubmit} />
      <div className="mt-6">
        <button 
          onClick={handleSubmit} 
          className="w-full bg-white text-black border-2 border-black font-bold py-3 px-4 rounded shadow-lg hover:bg-black hover:text-white transition-colors duration-300">
          Submit
        </button>
      </div>
    </div>
  );
};

export default EditArticlePage;
