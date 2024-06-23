import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface ArticleEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSubmit: () => void;
}

const ArticleEditor: React.FC<ArticleEditorProps> = ({ content, onChange, onSubmit }) => {
  return (
    <div>
      <ReactQuill value={content} onChange={onChange} />
    </div>
  );
};

export default ArticleEditor;
