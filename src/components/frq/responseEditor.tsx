"use client";

import {
  Bold,
  ClipboardPaste,
  Copy,
  Italic,
  List,
  Omega,
  Redo2,
  Scissors,
  Subscript,
  Superscript,
  Underline,
  Undo2,
} from "lucide-react";
import { useEffect, useRef } from "react";

type FRQResponseEditorProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
};

const FRQResponseEditor = ({
  value,
  onChange,
  ariaLabel,
}: FRQResponseEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      editorRef.current &&
      editorRef.current.innerHTML !== value
    ) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const runCommand = (command: string) => {
    editorRef.current?.focus();
    document.execCommand(command);

    onChange(editorRef.current?.innerHTML ?? "");
  };

const insertText = (text: string) => {
  editorRef.current?.focus();
  document.execCommand("insertText", false, text);
  onChange(editorRef.current?.innerHTML ?? "");
};

const pasteFromClipboard = async () => {
  try {
    const clipboardText = await navigator.clipboard.readText();
    insertText(clipboardText);
  } catch {
    window.alert(
      "Clipboard access was blocked. Use Ctrl+V instead.",
    );
  }
};

  return (
    <div className="overflow-hidden border border-neutral-400 bg-white">
      <div className="flex min-h-9 flex-wrap items-center gap-1 border-b border-neutral-300 px-2">
  <button
    type="button"
    className="rounded p-1 hover:bg-neutral-100"
    aria-label="Bold"
    onMouseDown={(event) => {
      event.preventDefault();
      runCommand("bold");
    }}
  >
    <Bold size={17} />
  </button>

  <button
    type="button"
    className="rounded p-1 hover:bg-neutral-100"
    aria-label="Italic"
    onMouseDown={(event) => {
      event.preventDefault();
      runCommand("italic");
    }}
  >
    <Italic size={17} />
  </button>

  <button
    type="button"
    className="rounded p-1 hover:bg-neutral-100"
    aria-label="Underline"
    onMouseDown={(event) => {
      event.preventDefault();
      runCommand("underline");
    }}
  >
    <Underline size={17} />
  </button>

  <div className="mx-1 h-6 w-px bg-neutral-300" />

  <button
    type="button"
    className="rounded p-1 hover:bg-neutral-100"
    aria-label="Insert omega symbol"
    onMouseDown={(event) => {
      event.preventDefault();
      insertText("Ω");
    }}
  >
    <Omega size={18} />
  </button>

  <div className="mx-1 h-6 w-px bg-neutral-300" />

  <button
    type="button"
    className="rounded p-1 hover:bg-neutral-100"
    aria-label="Cut"
    onMouseDown={(event) => {
      event.preventDefault();
      runCommand("cut");
    }}
  >
    <Scissors size={17} />
  </button>

  <button
    type="button"
    className="rounded p-1 hover:bg-neutral-100"
    aria-label="Copy"
    onMouseDown={(event) => {
      event.preventDefault();
      runCommand("copy");
    }}
  >
    <Copy size={17} />
  </button>

  <button
    type="button"
    className="rounded p-1 hover:bg-neutral-100"
    aria-label="Paste"
    onMouseDown={(event) => {
      event.preventDefault();
      void pasteFromClipboard();
    }}
  >
    <ClipboardPaste size={17} />
  </button>

  <div className="mx-1 h-6 w-px bg-neutral-300" />

  <button
    type="button"
    className="rounded p-1 hover:bg-neutral-100"
    aria-label="Undo"
    onMouseDown={(event) => {
      event.preventDefault();
      runCommand("undo");
    }}
  >
    <Undo2 size={17} />
  </button>

  <button
    type="button"
    className="rounded p-1 hover:bg-neutral-100"
    aria-label="Redo"
    onMouseDown={(event) => {
      event.preventDefault();
      runCommand("redo");
    }}
  >
    <Redo2 size={17} />
  </button>

  <div className="mx-1 h-6 w-px bg-neutral-300" />

  <button
    type="button"
    className="rounded p-1 hover:bg-neutral-100"
    aria-label="Superscript"
    onMouseDown={(event) => {
      event.preventDefault();
      runCommand("superscript");
    }}
  >
    <Superscript size={17} />
  </button>

  <button
    type="button"
    className="rounded p-1 hover:bg-neutral-100"
    aria-label="Subscript"
    onMouseDown={(event) => {
      event.preventDefault();
      runCommand("subscript");
    }}
  >
    <Subscript size={17} />
  </button>

  <div className="mx-1 h-6 w-px bg-neutral-300" />

  <button
    type="button"
    className="rounded p-1 hover:bg-neutral-100"
    aria-label="Bulleted list"
    onMouseDown={(event) => {
      event.preventDefault();
      runCommand("insertUnorderedList");
    }}
  >
    <List size={18} />
  </button>
</div>

      <div
        ref={editorRef}
        role="textbox"
        aria-label={ariaLabel}
        aria-multiline="true"
        contentEditable
        suppressContentEditableWarning
        className="min-h-56 p-3 text-sm leading-relaxed outline-none"
        onInput={(event) => {
          onChange(event.currentTarget.innerHTML);
        }}
      />
    </div>
  );
};

export default FRQResponseEditor;