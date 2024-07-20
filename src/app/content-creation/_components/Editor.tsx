import { memo, useEffect } from "react";
import {
  type EditorConfig,
  type ToolConstructable,
  type OutputData,
} from "@editorjs/editorjs";
import useEditor from "hooks/useEditor";

import Header from "@editorjs/header";
import SimpleImage from "@editorjs/simple-image";
import MathTex from "editorjs-math";
import Quote from "@editorjs/quote";
import Warning from "@editorjs/warning";
import Delimiter from "@editorjs/delimiter";
import List from "@editorjs/list";
import NestedList from "@editorjs/nested-list";
import AttachesTool from "@editorjs/attaches";
import Embed from "@editorjs/embed";
import Table from "@editorjs/table";
import CodeTool from "@editorjs/code";
import Marker from "@editorjs/marker";
import InlineCode from "@editorjs/inline-code";
import Underline from "@editorjs/underline";

export const EDITOR_TOOLS: EditorConfig["tools"] = {
  header: {
    // https://github.com/editor-js/header/issues/23#issuecomment-1488922203
    class: Header as unknown as ToolConstructable,
    shortcut: "CMD+SHIFT+H",
    inlineToolbar: true,
    config: {
      placeholder: "Enter a Header",
      levels: [1, 2, 3],
      defaultLevel: 2,
    },
  },

  image: {
    class: SimpleImage as unknown as ToolConstructable,
    inlineToolbar: true,
  },

  math: {
    class: MathTex as unknown as ToolConstructable,
    toolbox: {
      title: "LaTeX",
    },
  },

  list: {
    class: List as unknown as ToolConstructable,
    inlineToolbar: true,
    config: {
      defaultStyle: "unordered",
    },
  },

  quote: {
    class: Quote as unknown as ToolConstructable,
    inlineToolbar: true,
    shortcut: "CMD+SHIFT+O",
    config: {
      quotePlaceholder: "Enter a quote",
      captionPlaceholder: "Quote's author",
    },
  },

  warning: {
    class: Warning as unknown as ToolConstructable,
    inlineToolbar: true,
    shortcut: "CMD+SHIFT+W",
    config: {
      titlePlaceholder: "Title",
      messagePlaceholder: "Message",
    },
  },

  delimiter: Delimiter as unknown as ToolConstructable,

  table: {
    class: Table as unknown as ToolConstructable,
    config: {
      rows: 2,
      cols: 3,
    },
  },

  code: {
    class: CodeTool as unknown as ToolConstructable,
    inlineToolbar: true,
  },

  Marker: {
    class: Marker as unknown as ToolConstructable,
    shortcut: "CMD+SHIFT+M",
  },

  inlineCode: {
    class: InlineCode as unknown as ToolConstructable,
    shortcut: "CMD+SHIFT+M",
  },

  underline: Underline as unknown as ToolConstructable,
};

const Editor = ({ setData }: { setData: (data: OutputData) => void }) => {
  const { editor, isEditorReady } = useEditor({
    holder: "editorjs",
    tools: EDITOR_TOOLS,
    placeholder: "Start writing your content here...",
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
      editor && editor.destroy();
    };
  }, [editor]);

  return (
    <div>
      <div className="mb-4 ml-4 pb-4 opacity-50">Article:</div>
      <div className="prose mt-4" id="editorjs"></div>
    </div>
  );
};

export default memo(Editor);
