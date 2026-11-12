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
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment -- The call is safe
          const undo = new Undo({ editor });
          // Unless it is told what the editor opened with, the plugin's first
          // state is a single empty block, so the first Ctrl+Z after opening
          // a chapter undid all the way to that and emptied the editor. It is
          // given the editor's own saved output, not `config.data`: the plugin
          // compares block counts, and saving drops blocks such as empty
          // paragraphs, so a count taken from `config.data` could look like a
          // deleted block and make the first undo insert one.
          editor
            .save()
            .then((opened) => {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- The call is safe
              undo.initialize(opened);
            })
            .catch((error) => {
              console.error("Could not set the undo starting point:", error);
            });
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
