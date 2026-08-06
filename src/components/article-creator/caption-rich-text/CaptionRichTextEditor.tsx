"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Highlighter,
  Link as LinkIcon,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isValidUrl } from "./sanitize";
import { htmlToRichCaption, serializeRichCaption } from "./convert";
import { renderRichCaptionToHtml } from "./render";
import type { RichCaption, CaptionLinkMark } from "./types";

export interface CaptionRichTextEditorProps {
  value: RichCaption;
  onChange: (next: RichCaption) => void;
  placeholder?: string;
  className?: string;
}

interface SelectionState {
  range: Range | null;
  rect: DOMRect | null;
  activeMarks: Set<string>;
  linkMark: CaptionLinkMark | null;
}

const EMPTY_SELECTION: SelectionState = {
  range: null,
  rect: null,
  activeMarks: new Set(),
  linkMark: null,
};

export function CaptionRichTextEditor({
  value,
  onChange,
  placeholder = "Enter a caption...",
  className,
}: CaptionRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [selection, setSelection] = useState<SelectionState>(EMPTY_SELECTION);
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [linkDraft, setLinkDraft] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const lastExternalValue = useRef<RichCaption>(value);

  // Re-render DOM content only when value changes from outside (initial load,
  // undo, redo). While focused we treat the contentEditable as source of truth.
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (document.activeElement !== el && lastExternalValue.current !== value) {
      el.innerHTML = renderRichCaptionToHtml(value);
      lastExternalValue.current = value;
    }
  }, [value]);

  // Mount initial content when the editor first becomes available.
  useEffect(() => {
    const el = editorRef.current;
    if (el && el.innerHTML === "") {
      el.innerHTML = renderRichCaptionToHtml(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commit = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const next = htmlToRichCaption(el.innerHTML);
    const serialized = serializeRichCaption(next);
    lastExternalValue.current = serialized;
    onChange(serialized);
  }, [onChange]);

  const refreshSelectionState = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      setSelection(EMPTY_SELECTION);
      setLinkPopoverOpen(false);
      return;
    }
    const range = sel.getRangeAt(0);
    const root = editorRef.current;
    if (!root?.contains(range.commonAncestorContainer)) {
      setSelection(EMPTY_SELECTION);
      return;
    }
    let rect: DOMRect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      const rects = range.getClientRects();
      const firstRect = rects[0];
      if (firstRect) rect = firstRect;
    }

    const activeMarks = new Set<string>();
    let linkMark: CaptionLinkMark | null = null;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node: Node | null = walker.currentNode;
    while (node) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const textNode = node;
      if (range.intersectsNode(textNode)) {
        let el: Element | null = textNode.parentElement;
        while (el && el !== root) {
          const tag = el.tagName.toLowerCase();
          if (tag === "strong" || tag === "b") activeMarks.add("bold");
          else if (tag === "em" || tag === "i") activeMarks.add("italic");
          else if (tag === "u") activeMarks.add("underline");
          else if (tag === "mark") activeMarks.add("highlight");
          else if (tag === "a") {
            activeMarks.add("link");
            const href = el.getAttribute("href") ?? "";
            if (isValidUrl(href) && !linkMark) {
              linkMark = { type: "link", href };
            }
          }
          el = el.parentElement;
        }
      }
      node = walker.nextNode();
    }

    setSelection({ range, rect, activeMarks, linkMark });
  }, []);

  useEffect(() => {
    const handler = () => requestAnimationFrame(refreshSelectionState);
    document.addEventListener("selectionchange", handler);
    return () => document.removeEventListener("selectionchange", handler);
  }, [refreshSelectionState]);

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLDivElement>) => {
      // Defer commit so click events on toolbar/popover can still fire first.
      requestAnimationFrame(() => {
        if (!editorRef.current) return;
        if (
          document.activeElement &&
          editorRef.current.parentElement?.contains(document.activeElement)
        ) {
          return;
        }
        commit();
        setSelection(EMPTY_SELECTION);
        setLinkPopoverOpen(false);
      });
      void e;
    },
    [commit],
  );

  const applyCommand = useCallback(
    (command: "bold" | "italic" | "underline" | "highlight") => {
      editorRef.current?.focus();
      if (selection.range) {
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(selection.range);
      }
      if (command === "highlight") {
        // execCommand("HiliteColor"/"backColor") is unreliable, so wrap the
        // selection in <mark> manually when there's any selected text.
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
          const range = sel.getRangeAt(0);
          const fragment = range.extractContents();
          const mark = document.createElement("mark");
          mark.appendChild(fragment);
          range.insertNode(mark);
          // Re-select what we just inserted
          sel.removeAllRanges();
          const newRange = document.createRange();
          newRange.selectNodeContents(mark);
          sel.addRange(newRange);
        }
      } else {
        document.execCommand(command);
      }
      commit();
      refreshSelectionState();
    },
    [selection.range, commit, refreshSelectionState],
  );

  const toggleLink = useCallback(() => {
    setLinkError(null);
    setLinkDraft(selection.linkMark?.href ?? "");
    setLinkPopoverOpen(true);
  }, [selection.linkMark]);

  const confirmLink = useCallback(() => {
    setLinkError(null);
    const url = linkDraft.trim();
    if (!url) {
      setLinkError("URL cannot be empty.");
      return;
    }
    if (!isValidUrl(url)) {
      setLinkError("Enter a valid http(s):// or mailto: URL.");
      return;
    }
    if (!selection.range || selection.range.collapsed) {
      setLinkError("Select some text to link first.");
      return;
    }

    editorRef.current?.focus();
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(selection.range);

    document.execCommand("createLink", false, url);
    const root = editorRef.current;
    if (root) {
      const anchors = root.querySelectorAll("a[href]");
      anchors.forEach((a) => {
        const href = a.getAttribute("href") ?? "";
        if (isValidUrl(href)) {
          a.setAttribute("target", "_blank");
          a.setAttribute("rel", "noopener noreferrer");
        }
      });
    }
    setLinkPopoverOpen(false);
    setLinkDraft("");
    commit();
    refreshSelectionState();
  }, [linkDraft, selection.range, commit, refreshSelectionState]);

  const removeLink = useCallback(() => {
    editorRef.current?.focus();
    if (selection.range) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(selection.range);
    }
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      let anchor: HTMLAnchorElement | null = null;
      const node = sel.anchorNode;
      if (node?.parentElement) {
        anchor = node.parentElement.closest("a");
      }
      if (anchor && editorRef.current?.contains(anchor)) {
        const r = document.createRange();
        r.selectNodeContents(anchor);
        sel.removeAllRanges();
        sel.addRange(r);
      }
    }
    document.execCommand("unlink");
    setLinkPopoverOpen(false);
    commit();
    refreshSelectionState();
  }, [selection.range, commit, refreshSelectionState]);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();
      const html = e.clipboardData.getData("text/html");
      const text = e.clipboardData.getData("text/plain");
      const source = html || text;
      if (!source) return;
      const fragments = htmlToRichCaption(source);
      const safe = renderRichCaptionToHtml(fragments);
      document.execCommand("insertHTML", false, safe);
      commit();
    },
    [commit],
  );

  // These use position: fixed (see globals.css), so they're positioned
  // directly from the selection's viewport-relative rect with no scrollY
  // offset. Adding scrollY here would double-count the page's scroll
  // position against a `position: absolute` ancestor that generally isn't
  // anchored to the document origin, pushing the toolbar off-screen for any
  // caption that isn't at the very top of the page.
  const toolbarStyle: React.CSSProperties = selection.rect
    ? {
        top: Math.max(8, selection.rect.top - 44),
        left: Math.min(
          window.innerWidth - 280,
          Math.max(8, selection.rect.left + selection.rect.width / 2 - 140),
        ),
      }
    : { display: "none" };

  const linkStyle: React.CSSProperties = selection.rect
    ? {
        top: Math.max(8, selection.rect.top - 60),
        left: Math.min(
          window.innerWidth - 340,
          Math.max(8, selection.rect.left + selection.rect.width / 2 - 160),
        ),
      }
    : {};

  return (
    <div className={cn("caption-editor-root relative", className)}>
      <div
        ref={editorRef}
        className="caption-editor-field"
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur}
        onInput={commit}
        onKeyUp={refreshSelectionState}
        onMouseUp={refreshSelectionState}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        aria-label="Image caption"
        role="textbox"
        aria-multiline="true"
        tabIndex={0}
      />

      {selection.rect && !linkPopoverOpen && (
        <div
          className="caption-toolbar"
          style={toolbarStyle}
          role="toolbar"
          aria-label="Caption formatting"
        >
          <ToolbarButton
            label="Bold"
            icon={<Bold aria-hidden="true" />}
            active={selection.activeMarks.has("bold")}
            onClick={() => applyCommand("bold")}
          />
          <ToolbarButton
            label="Italic"
            icon={<Italic aria-hidden="true" />}
            active={selection.activeMarks.has("italic")}
            onClick={() => applyCommand("italic")}
          />
          <ToolbarButton
            label="Underline"
            icon={<Underline aria-hidden="true" />}
            active={selection.activeMarks.has("underline")}
            onClick={() => applyCommand("underline")}
          />
          <ToolbarButton
            label="Highlight"
            icon={<Highlighter aria-hidden="true" />}
            active={selection.activeMarks.has("highlight")}
            onClick={() => applyCommand("highlight")}
          />
          <ToolbarButton
            label="Add or edit link"
            icon={<LinkIcon aria-hidden="true" />}
            active={selection.activeMarks.has("link")}
            onClick={toggleLink}
          />
        </div>
      )}

      {linkPopoverOpen && (
        <div
          className="caption-link-popover"
          style={linkStyle}
          role="dialog"
          aria-label="Edit link"
        >
          <Label htmlFor="caption-link-url" className="sr-only">
            Link URL
          </Label>
          <Input
            id="caption-link-url"
            value={linkDraft}
            onChange={(e) => setLinkDraft(e.target.value)}
            placeholder="https://example.com"
            aria-invalid={!!linkError}
            aria-describedby={linkError ? "caption-link-error" : undefined}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                confirmLink();
              } else if (e.key === "Escape") {
                e.preventDefault();
                setLinkPopoverOpen(false);
                editorRef.current?.focus();
              }
            }}
            autoFocus
          />
          {linkError && (
            <p
              id="caption-link-error"
              role="alert"
              className="caption-link-error"
            >
              {linkError}
            </p>
          )}
          <div className="caption-link-actions">
            <Button size="sm" onClick={confirmLink}>
              Apply
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setLinkPopoverOpen(false);
                editorRef.current?.focus();
              }}
            >
              Cancel
            </Button>
            {selection.linkMark && (
              <Button
                size="sm"
                variant="ghost"
                onClick={removeLink}
                aria-label="Remove link"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
                Remove
              </Button>
            )}
            {selection.linkMark && (
              <a
                href={selection.linkMark.href}
                target="_blank"
                rel="noopener noreferrer"
                className="caption-link-open"
                aria-label="Open link in new tab"
              >
                <ExternalLink aria-hidden="true" className="h-4 w-4" />
                Open
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface ToolbarButtonProps {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

function ToolbarButton({ label, icon, active, onClick }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "caption-toolbar-btn",
        active && "caption-toolbar-btn-active",
      )}
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}
