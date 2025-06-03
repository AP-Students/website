// https://github.com/codex-team/editor.js/issues/2731

import { useEffect, useRef, useState } from "react";
import EditorJS from "@editorjs/editorjs";
import { type EditorConfig } from "@editorjs/editorjs/types/configs";
import Undo from "editorjs-undo";

const useEditor = (config: EditorConfig) => {
  const [isEditorReady, setIsEditorReady] = useState(false);
  const editorInstance = useRef<EditorJS | null>(null);

  useEffect(() => {
    if (!editorInstance.current) {
      const editor = new EditorJS({
        ...config,
        onReady: () => {
          setIsEditorReady(true);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- The call is safe
          new Undo({ editor });
          config.onReady?.();
        },
        onChange: (api, event) => {
          config.onChange?.(api, event);
        },
        i18n: {
          messages: {
            toolNames: {
              Marker: "Highlight",
              InlineCode: "Inline Code",
            },
          },
        },
      });

      editorInstance.current = editor;
    }
    return () => {
      if (editorInstance.current?.destroy) {
        editorInstance.current.destroy();
        editorInstance.current = null;
      }
    };
  }, [config]);

  return {
    isEditorReady,
    editor: editorInstance.current,
    editorRef: editorInstance,
  };
};

export default useEditor;
