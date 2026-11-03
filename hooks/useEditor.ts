// https://github.com/codex-team/editor.js/issues/2731

import { useEffect, useRef, useState } from "react";
import EditorJS from "@editorjs/editorjs";
import { type EditorConfig } from "@editorjs/editorjs/types/configs";
import Undo from "editorjs-undo";

const useEditor = (config: EditorConfig) => {
  const [isEditorReady, setIsEditorReady] = useState(false);
  const editorInstance = useRef<EditorJS | null>(null);
  // Cleared on unmount only, not on the `config` changes that re-run the
  // effect below. EditorJS can finish starting after the author has left (Back
  // pressed while a chapter loads), when its holder is already gone.
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!editorInstance.current) {
      const editor = new EditorJS({
        ...config,
        onReady: () => {
          if (!mounted.current) {
            // The undo plugin would look up the removed holder and throw.
            // `destroy` only exists once EditorJS is ready, so the unmount
            // cleanup could not release this instance; it is released here.
            editor.destroy();
            return;
          }

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
