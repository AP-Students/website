"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Bold, Highlighter, Italic, Underline } from "lucide-react";
import { RICH_TEXT_LIST_CLASSES, sanitizeQuestionRichText } from "./richText";

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

/**
 * Every `mark` the range touches, even partially. Containment is not enough:
 * when the selection sits inside a single highlight that `mark` is the range's
 * common ancestor rather than a node within it, so range extraction never sees
 * it and the highlight cannot be removed.
 */
const marksInRange = (editor: HTMLElement | null, range: Range) =>
  Array.from(editor?.querySelectorAll("mark") ?? []).filter((mark) =>
    range.intersectsNode(mark),
  );

const RichTextEditor = forwardRef<HTMLDivElement, Props>(
  function RichTextEditor(
    { value, onChange, placeholder, onKeyDown },
    forwardedRef,
  ) {
    const editorRef = useRef<HTMLDivElement>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const selectionRef = useRef<Range | null>(null);
    const [toolbar, setToolbar] = useState<{
      top: number;
      left: number;
    } | null>(null);
    const [active, setActive] = useState<Record<Format, boolean>>({
      bold: false,
      italic: false,
      underline: false,
      highlight: false,
    });

    useImperativeHandle(forwardedRef, () => editorRef.current!, []);

    useEffect(() => {
      const editor = editorRef.current;
      const clean = sanitizeQuestionRichText(value);
      if (editor && editor.innerHTML !== clean) editor.innerHTML = clean;
    }, [value]);

    const getSelectionOffsets = () => {
      const editor = editorRef.current;
      const selection = window.getSelection();
      if (
        !editor ||
        !selection?.rangeCount ||
        !editor.contains(selection.anchorNode)
      )
        return null;

      const range = selection.getRangeAt(0);
      const before = range.cloneRange();
      before.selectNodeContents(editor);
      before.setEnd(range.startContainer, range.startOffset);
      return {
        start: before.toString().length,
        end: before.toString().length + range.toString().length,
      };
    };

    const restoreSelectionOffsets = (
      offsets: { start: number; end: number } | null,
    ) => {
      const editor = editorRef.current;
      if (!editor || !offsets) return;

      const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      let position = 0;
      let startSet = false;
      let node = walker.nextNode();
      while (node) {
        const length = node.textContent?.length ?? 0;
        if (!startSet && offsets.start <= position + length) {
          range.setStart(node, Math.max(0, offsets.start - position));
          startSet = true;
        }
        if (startSet && offsets.end <= position + length) {
          range.setEnd(node, Math.max(0, offsets.end - position));
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
          return;
        }
        position += length;
        node = walker.nextNode();
      }

      // The selection was at the very end of an empty or newly-normalized field.
      range.selectNodeContents(editor);
      range.collapse(false);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    };

    const updateToolbar = useCallback(() => {
      const editor = editorRef.current;
      const selection = window.getSelection();
      if (
        !editor ||
        !selection?.rangeCount ||
        selection.isCollapsed ||
        !editor.contains(selection.anchorNode)
      ) {
        setToolbar(null);
        return;
      }
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      selectionRef.current = selection.getRangeAt(0).cloneRange();
      const toolbarWidth = 172;
      const toolbarHeight = 42;
      setToolbar({
        top:
          rect.top >= toolbarHeight + 8
            ? rect.top - toolbarHeight - 8
            : rect.bottom + 8,
        left: Math.min(
          Math.max(8, rect.left),
          Math.max(8, window.innerWidth - toolbarWidth - 8),
        ),
      });
      setActive({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        // Derived from the whole range rather than the anchor: `anchorNode` is the
        // end of a backwards selection, so an anchor test made the reported state
        // depend on which way the user dragged.
        highlight: marksInRange(editor, selection.getRangeAt(0)).length > 0,
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

    // Restoring the caret is only correct when sanitizing actually replaced
    // innerHTML, which is what destroys the selection. Doing it on every input
    // collapses a caret sitting on a freshly created empty line back onto the
    // previous one, because a `<br>` contributes no characters to the offset
    // model. `explicitOffsets` is for callers that rewrote the DOM themselves.
    const emitChange = (
      explicitOffsets?: { start: number; end: number } | null,
    ) => {
      const editor = editorRef.current;
      if (!editor) return;
      // Read before the rewrite below: overwriting innerHTML drops the selection.
      const offsets = explicitOffsets ?? getSelectionOffsets();
      const clean = sanitizeQuestionRichText(editor.innerHTML);
      if (editor.innerHTML !== clean) {
        editor.innerHTML = clean;
        restoreSelectionOffsets(offsets);
      } else if (explicitOffsets) {
        restoreSelectionOffsets(explicitOffsets);
      }
      onChange(clean);
    };

    const removeHighlightFromSelection = (range: Range) => {
      marksInRange(editorRef.current, range).forEach((mark) =>
        mark.replaceWith(...Array.from(mark.childNodes)),
      );
    };

    const applyFormat = (format: Format) => {
      const editor = editorRef.current;
      const offsets = getSelectionOffsets();
      const plainText = editor?.textContent ?? "";
      // `$@...$` is parsed into KaTeX by the learner renderer. Formatting a
      // range that crosses one of those delimiters can cause browsers to split
      // the token between elements, leaving it unparsable. Keep math atomic;
      // authors can still format normal text on either side of it.
      const touchesLatex =
        offsets &&
        Array.from(plainText.matchAll(/\$@[^$]+\$/g)).some((match) => {
          const start = match.index ?? 0;
          const end = start + match[0].length;
          return offsets.start < end && offsets.end > start;
        });
      if (touchesLatex) return;

      const browserSelection = window.getSelection();
      const savedSelection =
        browserSelection?.rangeCount &&
        editor?.contains(browserSelection.anchorNode)
          ? browserSelection.getRangeAt(0).cloneRange()
          : selectionRef.current;
      if (savedSelection) {
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(savedSelection);
      }
      // Tested against the live range, not `active`: that state is refreshed on a
      // rAF and can lag the selection that is about to be formatted, which made
      // the removal branch unreachable for the selections that most need it.
      if (
        format === "highlight" &&
        savedSelection &&
        marksInRange(editor, savedSelection).length > 0
      ) {
        removeHighlightFromSelection(savedSelection);
        emitChange(offsets);
        editorRef.current?.focus();
        requestAnimationFrame(updateToolbar);
        return;
      }
      const config = formatConfig[format];
      document.execCommand(
        config.command,
        false,
        format === "highlight" ? "#fef08a" : undefined,
      );
      emitChange();
      editorRef.current?.focus();
      requestAnimationFrame(updateToolbar);
    };

    const handleEditorKeyDown = (
      event: React.KeyboardEvent<HTMLDivElement>,
    ) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || (!event.ctrlKey && !event.metaKey)) return;

      const key = event.key.toLowerCase();
      const shortcutFormat =
        key === "b"
          ? "bold"
          : key === "i"
            ? "italic"
            : key === "u"
              ? "underline"
              : key === "h" && event.shiftKey
                ? "highlight"
                : null;
      if (!shortcutFormat) return;

      event.preventDefault();
      applyFormat(shortcutFormat);
    };

    return (
      <div className="relative">
        {/*
        `whitespace-pre-wrap` matches the learner renderer. Questions written
        before this box became rich text store their line breaks as newline
        characters, and HTML whitespace collapsing rendered each of those as
        a single space, so opening an older explanation looked like its
        paragraphs had been merged together (#372).
      */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          data-placeholder={placeholder}
          onInput={() => emitChange()}
          onKeyDown={handleEditorKeyDown}
          onKeyUp={updateToolbar}
          onMouseUp={updateToolbar}
          onBlur={(event) => {
            if (
              !toolbarRef.current?.contains(event.relatedTarget as Node | null)
            )
              setToolbar(null);
          }}
          onPaste={(event) => {
            event.preventDefault();
            event.stopPropagation();
            const html = event.clipboardData.getData("text/html");
            const text = event.clipboardData.getData("text/plain");
            document.execCommand(
              "insertHTML",
              false,
              sanitizeQuestionRichText(html || text),
            );
            emitChange();
          }}
          // The list classes match what RenderContent applies when this markup is
          // read back. `ul`/`ol`/`li` survive the sanitizer and arrive here by
          // paste, and preflight otherwise strips their markers and indent, so a
          // pasted list looked like flat lines while it was being edited.
          className={`min-h-24 w-full whitespace-pre-wrap rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&:empty]:before:pointer-events-none [&:empty]:before:text-muted-foreground [&:empty]:before:content-[attr(data-placeholder)] [&_mark]:rounded [&_mark]:bg-yellow-200 [&_mark]:px-0.5 [&_mark]:text-gray-950 ${RICH_TEXT_LIST_CLASSES}`}
        />
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
              const Icon =
                format === "bold"
                  ? Bold
                  : format === "italic"
                    ? Italic
                    : format === "underline"
                      ? Underline
                      : Highlighter;
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
      </div>
    );
  },
);

export default RichTextEditor;
