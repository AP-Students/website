"use client";

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Bold, Highlighter, Italic, Underline } from "lucide-react";
import { sanitizeQuestionRichText } from "./richText";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
}

type Format = "bold" | "italic" | "underline" | "highlight";

const formatConfig: Record<Format, { label: string; command: string }> = {
  bold: { label: "Bold", command: "bold" },
  italic: { label: "Italic", command: "italic" },
  underline: { label: "Underline", command: "underline" },
  highlight: { label: "Highlight", command: "hiliteColor" },
};

const RichTextEditor = forwardRef<HTMLDivElement, Props>(function RichTextEditor({ value, onChange, placeholder, onKeyDown }, forwardedRef) {
  const editorRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const [toolbar, setToolbar] = useState<{ top: number; left: number } | null>(null);
  const [active, setActive] = useState<Record<Format, boolean>>({
    bold: false, italic: false, underline: false, highlight: false,
  });

  useImperativeHandle(forwardedRef, () => editorRef.current!, []);

  useEffect(() => {
    const editor = editorRef.current;
    const clean = sanitizeQuestionRichText(value);
    if (editor && editor.innerHTML !== clean) editor.innerHTML = clean;
  }, [value]);

  const updateToolbar = useCallback(() => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection?.rangeCount || selection.isCollapsed || !editor.contains(selection.anchorNode)) {
      setToolbar(null);
      return;
    }
    const rect = selection.getRangeAt(0).getBoundingClientRect();
    selectionRef.current = selection.getRangeAt(0).cloneRange();
    const toolbarWidth = 172;
    const toolbarHeight = 42;
    setToolbar({
      top: rect.top >= toolbarHeight + 8 ? rect.top - toolbarHeight - 8 : rect.bottom + 8,
      left: Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - toolbarWidth - 8)),
    });
    const anchorElement = selection.anchorNode?.nodeType === Node.ELEMENT_NODE
      ? (selection.anchorNode as Element)
      : selection.anchorNode?.parentElement;
    setActive({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      highlight: Boolean(anchorElement?.closest("mark")),
    });
  }, []);

  useEffect(() => {
    const refresh = () => requestAnimationFrame(updateToolbar);
    window.addEventListener("resize", refresh);
    window.addEventListener("scroll", refresh, true);
    document.addEventListener("selectionchange", refresh);
    return () => {
      window.removeEventListener("resize", refresh);
      window.removeEventListener("scroll", refresh, true);
      document.removeEventListener("selectionchange", refresh);
    };
  }, [updateToolbar]);

  const emitChange = () => {
    if (editorRef.current) onChange(sanitizeQuestionRichText(editorRef.current.innerHTML));
  };

  const applyFormat = (format: Format) => {
    const savedSelection = selectionRef.current;
    if (savedSelection) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(savedSelection);
    }
    const config = formatConfig[format];
    document.execCommand(
      config.command,
      false,
      format === "highlight" ? (active.highlight ? "transparent" : "#fef08a") : undefined,
    );
    emitChange();
    editorRef.current?.focus();
    requestAnimationFrame(updateToolbar);
  };

  return (
    <div className="relative">
      {toolbar && (
        <div
          role="toolbar"
          aria-label="Text formatting"
          ref={toolbarRef}
          className="fixed z-50 flex min-h-9 items-center gap-1 rounded-md border border-gray-300 bg-white p-1 shadow-lg"
          style={{ top: toolbar.top, left: toolbar.left }}
          onMouseDown={(event) => event.preventDefault()}
        >
          {(Object.keys(formatConfig) as Format[]).map((format) => {
            const Icon = format === "bold" ? Bold : format === "italic" ? Italic : format === "underline" ? Underline : Highlighter;
            return (
              <button
                key={format}
                type="button"
                aria-label={formatConfig[format].label}
                aria-pressed={active[format]}
                title={formatConfig[format].label}
                onClick={() => applyFormat(format)}
                className={`rounded p-1.5 text-gray-700 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${active[format] ? "bg-yellow-200" : "hover:bg-gray-100"}`}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>
      )}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={emitChange}
        onKeyDown={onKeyDown}
        onKeyUp={updateToolbar}
        onMouseUp={updateToolbar}
        onBlur={(event) => {
          if (!toolbarRef.current?.contains(event.relatedTarget as Node | null)) setToolbar(null);
        }}
        onPaste={(event) => {
          event.preventDefault();
          const html = event.clipboardData.getData("text/html");
          const text = event.clipboardData.getData("text/plain");
          document.execCommand("insertHTML", false, sanitizeQuestionRichText(html || text));
          emitChange();
        }}
        className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&:empty]:before:pointer-events-none [&:empty]:before:text-muted-foreground [&:empty]:before:content-[attr(data-placeholder)] [&_mark]:rounded [&_mark]:bg-yellow-200 [&_mark]:px-0.5 [&_mark]:text-gray-950"
      />
    </div>
  );
});

export default RichTextEditor;
