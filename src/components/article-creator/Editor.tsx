import React, { memo, useEffect, useRef, useState } from "react";
import {
  type EditorConfig,
  type OutputData,
  type ToolConstructable,
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
import { ClipboardCopy, Upload } from "lucide-react";
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from "firebase/storage";
import { buttonVariants } from "../ui/button";
import { cn, resolveUploadContentType } from "@/lib/utils";

interface EditorImageData {
  file: { url?: string; storageRefFullPath?: string; [key: string]: unknown };
  caption?: string;
  withBorder?: boolean;
  withBackground?: boolean;
  stretched?: boolean;
}

type MenuConfigItemList = Array<{
  name: string;
  icon: string;
  title: string;
  onActivate?: () => void;
  toggle?: boolean;
}>;

type CustomImageTool = {
  _data: EditorImageData;
  api: {
    blocks: {
      getBlockIndex(blockId: string): number;
      delete(index?: number): void;
    };
  };
  block: {
    id: string;
  };
  renderSettings(): MenuConfigItemList;
};

const pendingStorageDeletes = new Set<string>();

function isStorageObjectNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "storage/object-not-found"
  );
}

// https://github.com/editor-js/image/issues/54#issuecomment-1546833098
// https://github.com/editor-js/image/issues/27
class CustomImage extends Image {
  renderSettings(): MenuConfigItemList {
    const typedTool = this as unknown as CustomImageTool;
    const baseImageTool = Image as unknown as {
      prototype: {
        renderSettings(this: CustomImageTool): MenuConfigItemList;
      };
    };
    // The EditorJS image package ships loose inherited typings here, so we
    // constrain the call at the boundary instead of widening the rest of the file.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const settings = baseImageTool.prototype.renderSettings.call(typedTool);
    const settingsArray = (
      Array.isArray(settings) ? settings : [settings]
    ) as unknown[];

    return [
      {
        name: "deleteImage",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>`,
        title: "Delete image",
        onActivate: () => {
          const { file } = typedTool._data;
          const blockIndex = typedTool.api.blocks.getBlockIndex(
            typedTool.block.id,
          );

          if (blockIndex === -1) {
            return;
          }

          if (file.storageRefFullPath) {
            pendingStorageDeletes.add(file.storageRefFullPath);
          }

          typedTool.api.blocks.delete(blockIndex);
        },
      },
      ...settingsArray,
    ] as unknown as MenuConfigItemList;
  }

  removed() {
    const { file } = this._data as EditorImageData;

    if (!file.storageRefFullPath) return;
    if (!pendingStorageDeletes.has(file.storageRefFullPath)) return;

    pendingStorageDeletes.delete(file.storageRefFullPath);

    const storage = getStorage();
    const storageRef = ref(storage, file.storageRefFullPath);
    deleteObject(storageRef)
      .then(() => {
        console.log("Deleted " + file.storageRefFullPath);
      })
      .catch((error) => {
        if (isStorageObjectNotFoundError(error)) {
          return;
        }

        console.error(
          "Failed to delete image from Firebase Storage:",
          file.storageRefFullPath,
          error,
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
          if (file.size > 5 * 1024 * 1024) {
            alert(`File "${file.name}" is too large.`);
            return { success: 0 };
          }

          const storage = getStorage();
          const storageRef = ref(
            storage,
            "images/" + new Date().getTime() + "_" + file.name,
          );

          try {
            const contentType = resolveUploadContentType(file);
            const snapshot = await uploadBytes(
              storageRef,
              file,
              contentType ? { contentType } : undefined,
            );
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pastedJson, setPastedJson] = useState<string>("");

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

  const isValidEditorOutputData = (value: unknown): value is OutputData => {
    if (!value || typeof value !== "object") return false;

    const candidate = value as {
      blocks?: unknown;
      time?: unknown;
      version?: unknown;
    };
    return (
      Array.isArray(candidate.blocks) &&
      typeof candidate.time === "number" &&
      typeof candidate.version === "string"
    );
  };

  const importEditorData = async (parsed: unknown) => {
    if (!isValidEditorOutputData(parsed)) {
      alert(
        "Invalid EditorJS JSON. Data must include at least numeric time and a blocks array.",
      );
      return;
    }

    if (!editorRef.current?.render) {
      alert("Editor is not ready yet. Please try again in a moment.");
      return;
    }

    await editorRef.current.render(parsed);
    setData(parsed);
    setUnsavedChanges(true);
  };

  const handleUploadEditorData = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    try {
      const fileText = await file.text();
      const parsed = JSON.parse(fileText) as unknown;
      await importEditorData(parsed);
    } catch (error) {
      console.error("Error importing editor data:\n", error);
      alert("Failed to import JSON data.\n" + String(error));
    }
  };

  const handleImportPastedJson = async () => {
    if (!pastedJson.trim()) {
      alert("Paste JSON text first.");
      return;
    }

    try {
      const parsed = JSON.parse(pastedJson) as unknown;
      await importEditorData(parsed);
    } catch (error) {
      console.error("Error importing pasted JSON:\n", error);
      alert("Failed to parse pasted JSON.\n" + String(error));
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
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          className={cn(
            buttonVariants({ variant: "outline" }),
            "rounded-sm pl-3",
          )}
          onClick={handleCopyEditorData}
          type="button"
        >
          <ClipboardCopy className="mr-1" />
          Copy Data to Clipboard
        </button>

        <button
          className={cn(
            buttonVariants({ variant: "outline" }),
            "rounded-sm pl-3",
          )}
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          <Upload className="mr-1" />
          Upload JSON
        </button>
      </div>

      <input
        accept="application/json,.json"
        className="hidden"
        onChange={handleUploadEditorData}
        ref={fileInputRef}
        type="file"
      />

      <div className="mb-4 rounded-sm border p-3">
        <label
          className="mb-2 block text-sm font-medium"
          htmlFor="pasted-editor-json"
        >
          Paste raw Editor JSON
        </label>
        <textarea
          className="min-h-40 w-full rounded-sm border p-2 font-mono text-xs"
          id="pasted-editor-json"
          onChange={(event) => setPastedJson(event.target.value)}
          placeholder='Paste JSON from "Copy Data to Clipboard" here'
          value={pastedJson}
        />
        <div className="mt-2 flex justify-end">
          <button
            className={cn(buttonVariants({ variant: "outline" }), "rounded-sm")}
            onClick={handleImportPastedJson}
            type="button"
          >
            Import Pasted JSON
          </button>
        </div>
      </div>

      <div className="prose w-full" id="editorjs"></div>
    </>
  );
};

export default memo(Editor);
