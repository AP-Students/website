"use client";

import { type EditorConfig } from "@editorjs/editorjs/types/configs";
import Header from "@editorjs/header";
import useEditor from "hooks/useEditor";

const config: EditorConfig = {
  holder: "editorjs",
  tools: {
    header: Header,
  },
};

function App() {
  const { editor, isEditorReady } = useEditor(config);

  return (
    <div>
      <div id="editorjs"></div>
    </div>
  );
}

export default App;
