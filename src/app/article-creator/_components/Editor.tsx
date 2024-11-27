import { memo, useEffect } from "react";
import {
  type EditorConfig,
  type ToolConstructable,
  type OutputData,
} from "@editorjs/editorjs";
import useEditor from "hooks/useEditor";

import Header from "@editorjs/header";
// @ts-expect-error The import is correct
import Paragraph from "@editorjs/paragraph";
import Quote from "@editorjs/quote";
import List from "@editorjs/list";
import Table from "@editorjs/table";
import CodeTool from "@editorjs/code";
import InlineCode from "@editorjs/inline-code";
import SimpleImage from "@editorjs/simple-image";
import Embed from "@editorjs/embed";
import Marker from "@editorjs/marker";
import Underline from "@editorjs/underline";
import MathTex from "editorjs-math";
import Delimiter from "@editorjs/delimiter";
import Alert from "editorjs-alert";
import { QuestionsAddCard } from "./custom_questions/QuestionsAddCard";

export const EDITOR_TOOLS: EditorConfig["tools"] = {
  header: {
    class: Header as unknown as ToolConstructable,
    shortcut: "CTRL+SHIFT+H",
    inlineToolbar: true,
    config: {
      placeholder: "Enter a Header",
      levels: [1, 2, 3],
      defaultLevel: 2,
    },
  },

  paragraph: {
    class: Paragraph as unknown as ToolConstructable,
    shortcut: "CTRL+SHIFT+P",
    inlineToolbar: true,
  },

  image: {
    class: SimpleImage as unknown as ToolConstructable,
    inlineToolbar: true,
  },

  list: {
    class: List as unknown as ToolConstructable,
    inlineToolbar: true,
    shortcut: "CTRL+ALT+8",
    config: {
      defaultStyle: "unordered",
    },
  },

  questionsAddCard: {
    class: QuestionsAddCard as unknown as ToolConstructable,
    shortcut: "CTRL+Q",
    inlineToolbar: true,
  },

  math: {
    class: MathTex as unknown as ToolConstructable,
    inlineToolbar: true,
    shortcut: "CTRL+ALT+M",
    toolbox: {
      title: "LaTeX",
    },
  },

  quote: {
    class: Quote as unknown as ToolConstructable,
    inlineToolbar: true,
    config: {
      quotePlaceholder: "Enter a quote",
      captionPlaceholder: "Quote's author",
    },
  },

  table: {
    class: Table as unknown as ToolConstructable,
    config: {
      rows: 2,
      cols: 3,
    },
  },

  inlineCode: {
    class: InlineCode as unknown as ToolConstructable,
    shortcut: "CTRL+ALT+C",
  },

  code: {
    class: CodeTool as unknown as ToolConstructable,
    inlineToolbar: true,
  },

  Marker: {
    class: Marker as unknown as ToolConstructable,
  },

  underline: {
    class: Underline as unknown as ToolConstructable,
  },

  alert: Alert as unknown as ToolConstructable,

  embed: {
    class: Embed as unknown as ToolConstructable,
    inlineToolbar: true,
  },

  delimiter: {
    class: Delimiter as unknown as ToolConstructable,
  },
};

const Editor = ({ setData, content }: { setData: (data: OutputData) => void, content: OutputData }) => {
  const { editor, isEditorReady } = useEditor({
    holder: "editorjs",
    tools: EDITOR_TOOLS,
    data: content ||  {
      time: Date.now(),
      blocks: [
        {
          id: "vN7jsMIAZd",
          type: "header",
          data: {
            text: "Enter title here...",
            level: 1,
          },
        },
        {
          id: "y5P_E6yFAY",
          type: "header",
          data: {
            text: "Enter a subheader...",
            level: 2,
          },
        },
        {
          id: "R0mt9g_qT4",
          type: "paragraph",
          data: {
            text: "This is some text...",
          },
        },
      ],
      version: "2.30.2",
    },
    placeholder: "Press '/' to see available blocks",
    onChange: (api, event) => {
      api.saver
        .save()
        .then((outputData) => {
          setData(outputData);
        })
        .catch((error) => {
          console.error("Saving failed: ", error);
        });
    },
    
  });

  useEffect(() => {
    return () => {
      // Check if the editor exists and is not already destroyed
      if (editor) {
        // Alternatively, you could remove the container div or handle cleanup differently
        const editorContainer = document.getElementById("editor-container");
        if (editorContainer) {
          editorContainer.innerHTML = ""; // This removes all child nodes
        }

        // If you still want to call destroy for cleanup, ensure it is safe to do so
        if (typeof editor.destroy === "function") {
          editor.destroy();
        }
      }
    };
  }, [editor]); 

  return (
    <div className="flex flex-col gap-y-4">
      <h2 className="opacity-50">Editor:</h2>
      <div className="prose w-full" id="editorjs"></div>
    </div>
  );
};

export default memo(Editor);
