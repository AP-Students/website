import { memo, useEffect } from "react";
import {
  type EditorConfig,
  type ToolConstructable,
  type OutputData,
} from "@editorjs/editorjs";
import useEditor from "hooks/useEditor";

import Header from "@editorjs/header";
import Paragraph from "@editorjs/paragraph";
import Quote from "@editorjs/quote";
import List from "@editorjs/list";
import Table from "@editorjs/table";
import CodeTool from "@editorjs/code";
import InlineCode from "@editorjs/inline-code";
import Image from "@editorjs/image";
import Embed from "@editorjs/embed";
import Marker from "@editorjs/marker";
import Underline from "@editorjs/underline";
import MathTex from "editorjs-math";
import Delimiter from "@editorjs/delimiter";
import Alert from "editorjs-alert";
import { QuestionsAddCard } from "./custom_questions/QuestionsAddCard";
import { ClipboardCopy } from "lucide-react";
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from "firebase/storage";
import { buttonVariants } from "../ui/button";
import { cn } from "@/lib/utils";

interface EditorImageData {
  file: { url?: string; storageRefFullPath?: string; [key: string]: unknown };
  caption?: string;
  withBorder?: boolean;
  withBackground?: boolean;
  stretched?: boolean;
}

// https://github.com/editor-js/image/issues/54#issuecomment-1546833098
// https://github.com/editor-js/image/issues/27
class CustomImage extends Image {
  removed() {
    const { file } = this._data as EditorImageData;

    if (!file.storageRefFullPath) return;

    const storage = getStorage();
    const storageRef = ref(storage, file.storageRefFullPath);
    deleteObject(storageRef)
      .then(() => {
        console.log("Deleted " + file.storageRefFullPath);
      })
      .catch((error) => {
        console.log(error);
        alert(
          "Failed to delete image from Firebase Storage: notify FiveHive Website Team.\n" +
            String(error),
        );
      });
  }
}

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
    class: CustomImage as unknown as ToolConstructable,
    inlineToolbar: false,
    config: {
      uploader: {
        async uploadByFile(file: File) {
          const storage = getStorage();
          const storageRef = ref(
            storage,
            "images/" + new Date().getTime() + "_" + file.name,
          );

          try {
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            return {
              success: 1,
              file: {
                url: downloadURL,
                storageRefFullPath: storageRef.fullPath,
              },
            };
          } catch (err) {
            console.log(err);

            return { success: 0 };
          }
        },
      },
      actions: [
        {
          name: "centerImage",
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-align-horizontal-space-around-icon lucide-align-horizontal-space-around"><rect width="6" height="10" x="9" y="7" rx="2"/><path d="M4 22V2"/><path d="M20 22V2"/></svg>`,
          title: "Center image",
          toggle: true,
        },
      ],
    },
  },

  list: {
    class: List as unknown as ToolConstructable,
    inlineToolbar: true,
    shortcut: "CTRL+ALT+8",
    config: { defaultStyle: "unordered" },
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
    toolbox: { title: "LaTeX" },
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
    config: { rows: 2, cols: 3 },
  },

  inlineCode: {
    class: InlineCode as unknown as ToolConstructable,
    shortcut: "CTRL+ALT+C",
  },

  code: {
    class: CodeTool as unknown as ToolConstructable,
    inlineToolbar: true,
  },

  Marker: { class: Marker as unknown as ToolConstructable },

  underline: { class: Underline as unknown as ToolConstructable },

  alert: Alert as unknown as ToolConstructable,

  embed: { class: Embed as unknown as ToolConstructable, inlineToolbar: true },

  delimiter: { class: Delimiter as unknown as ToolConstructable },
};

const Editor = ({
  setUnsavedChanges,
  setData,
  content,
}: {
  setUnsavedChanges: (unsavedChanges: boolean) => void;
  setData: (data: OutputData) => void;
  content: OutputData;
}) => {
  const { editor, editorRef } = useEditor({
    holder: "editorjs",
    tools: EDITOR_TOOLS,
    data: content || {
      time: Date.now(),
      blocks: [
        {
          id: "vN7jsMIAZd",
          type: "header",
          data: { text: "Enter title here...", level: 1 },
        },
        {
          id: "y5P_E6yFAY",
          type: "header",
          data: { text: "Enter a subheader...", level: 2 },
        },
        {
          id: "R0mt9g_qT4",
          type: "paragraph",
          data: { text: "This is some text..." },
        },
      ],
      version: "2.30.2",
    },
    placeholder: "Press '/' to see available blocks",
    onChange: (api) => {
      setUnsavedChanges(true);
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

  const handleCopyEditorData = async () => {
    if (!editorRef.current?.save) return;

    try {
      const savedData = await editorRef.current.save();
      const jsonString = JSON.stringify(savedData, null, 2); // Prettify JSON
      console.log("Editor data copied to clipboard:", jsonString);
      await navigator.clipboard.writeText(jsonString);
    } catch (error) {
      console.error("Error copying editor data:\n", error);
      alert("Failed to copy editor data!\n" + String(error));
    }
  };

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
    <>
      <button
        className={cn(
          buttonVariants({ variant: "outline" }),
          "rounded-sm pl-3",
        )}
        onClick={handleCopyEditorData}
      >
        <ClipboardCopy className="mr-1" />
        Copy Data to Clipboard
      </button>
      <div className="prose w-full" id="editorjs"></div>
    </>
  );
};

export default memo(Editor);
