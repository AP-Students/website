import React, { useEffect, useRef, useState } from 'react';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { DOMParser as ProseMirrorDOMParser } from 'prosemirror-model';
import { schema } from 'prosemirror-schema-basic';
import { exampleSetup } from 'prosemirror-example-setup';
import { defaultMarkdownParser, defaultMarkdownSerializer } from 'prosemirror-markdown';
import 'prosemirror-view/style/prosemirror.css';
import 'prosemirror-menu/style/menu.css';
import 'prosemirror-example-setup/style/style.css';

const editorStyles = `
  .ProseMirror h1 {
    font-size: 24px;
    font-weight: bold;
    margin-top: 20px;
    margin-bottom: 10px;
  }

  .ProseMirror h2 {
    font-size: 20px;
    font-weight: bold;
    margin-top: 18px;
    margin-bottom: 8px;
  }

  .ProseMirror h3 {
    font-size: 18px;
    font-weight: bold;
    margin-top: 16px;
    margin-bottom: 6px;
  }

  .ProseMirror h4 {
    font-size: 16px;
    font-weight: bold;
    margin-top: 14px;
    margin-bottom: 4px;
  }

  .ProseMirror h5 {
    font-size: 14px;
    font-weight: bold;
    margin-top: 12px;
    margin-bottom: 4px;
  }

  .ProseMirror h6 {
    font-size: 12px;
    font-weight: bold;
    margin-top: 10px;
    margin-bottom: 2px;
  }

  .ProseMirror pre {
    background-color: #f5f5f5;
    padding: 10px;
    border-radius: 4px;
    margin-top: 10px;
    margin-bottom: 10px;
    overflow-x: auto;
  }
`;

interface ArticleEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSubmit: () => void;
}

const ArticleEditor: React.FC<ArticleEditorProps> = ({ content, onChange, onSubmit }) => {
  const proseMirrorRef = useRef<HTMLDivElement | null>(null);
  const markdownRef = useRef<HTMLTextAreaElement | null>(null);
  const proseMirrorViewRef = useRef<EditorView | null>(null);
  const [isMarkdownMode, setIsMarkdownMode] = useState(false);

  useEffect(() => {
    if (!isMarkdownMode && proseMirrorRef.current && !proseMirrorViewRef.current) {
      const doc = ProseMirrorDOMParser.fromSchema(schema).parse(proseMirrorRef.current);

      const editorView = new EditorView(proseMirrorRef.current, {
        state: EditorState.create({
          doc,
          plugins: exampleSetup({ schema }),
        }),
        dispatchTransaction(transaction) {
          const newState = editorView.state.apply(transaction);
          editorView.updateState(newState);
          const markdownContent = defaultMarkdownSerializer.serialize(newState.doc);
          onChange(markdownContent);
        },
      });

      proseMirrorViewRef.current = editorView;
    }

    return () => {
      if (proseMirrorViewRef.current) {
        proseMirrorViewRef.current.destroy();
        proseMirrorViewRef.current = null;
      }
    };
  }, [isMarkdownMode, onChange]);

  const handleToggleMode = () => {
    setIsMarkdownMode(!isMarkdownMode);
  };

  const handleMarkdownChange = () => {
    if (markdownRef.current && proseMirrorViewRef.current) {
      const markdownContent = markdownRef.current.value;
      const markdownDoc = defaultMarkdownParser.parse(markdownContent);
      const newEditorState = EditorState.create({
        doc: markdownDoc,
        plugins: exampleSetup({ schema }),
      });
      proseMirrorViewRef.current.updateState(newEditorState);
      onChange(markdownContent);

      markdownRef.current.style.height = 'auto';
      markdownRef.current.style.height = `${Math.max(markdownRef.current.scrollHeight, 300)}px`;
    }
  };

  const handleMarkdownSubmit = () => {
    onSubmit();
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 40px)', padding: '20px' }}>
      <style>{editorStyles}</style>
      <div style={{ flex: 1, marginRight: '20px', height: '100%' }}>
        <div
          style={{
            border: '1px solid #ccc',
            minHeight: '500px',
            width: '100%',
            padding: '10px',
            height: '100%',
            overflow: 'auto',
          }}
          ref={proseMirrorRef}
        ></div>
        <br />
        <button
          style={{
            backgroundColor: '#333',
            color: '#fff',
            padding: '10px 20px',
            border: 'none',
            cursor: 'pointer',
            float: 'right',
            marginTop: '10px',
          }}
          onClick={handleMarkdownSubmit}
        >
          Submit
        </button>
      </div>
      <div style={{ flex: 1, height: '100%' }}>
        <textarea
          style={{
            border: '1px solid #ccc',
            minHeight: '500px',
            width: '100%',
            padding: '10px',
            height: '100%',
            resize: 'vertical',
            overflow: 'auto',
          }}
          value={content}
          onChange={handleMarkdownChange}
          ref={markdownRef}
        ></textarea>
      </div>
    </div>
  );
};

export default ArticleEditor;
