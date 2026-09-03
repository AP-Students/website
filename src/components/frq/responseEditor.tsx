"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { useEffect, useRef, useState } from "react";

import DOMPurify from "dompurify";

import { RICH_TEXT_LIST_CLASSES } from "@/components/article-creator/custom_questions/richText";

type FRQResponseEditorProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
};

/**
 * The palette behind the Ω button. Grouped the way a student looks for a
 * character rather than by Unicode block, and kept to what an AP free response
 * actually needs — a longer list is slower to scan, not more useful.
 */
const SPECIAL_CHARACTER_GROUPS: { label: string; characters: string[] }[] = [
  {
    label: "Greek",
    characters: [
      "α",
      "β",
      "γ",
      "δ",
      "ε",
      "ζ",
      "η",
      "θ",
      "κ",
      "λ",
      "μ",
      "ν",
      "π",
      "ρ",
      "σ",
      "τ",
      "φ",
      "χ",
      "ψ",
      "ω",
      "Γ",
      "Δ",
      "Θ",
      "Λ",
      "Ξ",
      "Π",
      "Σ",
      "Φ",
      "Ψ",
      "Ω",
    ],
  },
  {
    label: "Operators",
    characters: [
      "×",
      "÷",
      "±",
      "∓",
      "·",
      "√",
      "∛",
      "∑",
      "∏",
      "∫",
      "∮",
      "∂",
      "∇",
      "∆",
      "%",
      "‰",
      "°",
      "′",
      "″",
    ],
  },
  {
    label: "Relations",
    characters: ["≠", "≈", "≡", "≅", "∼", "≤", "≥", "≪", "≫", "∝", "∞"],
  },
  {
    label: "Sets & logic",
    characters: [
      "∈",
      "∉",
      "⊂",
      "⊄",
      "⊆",
      "⊇",
      "∪",
      "∩",
      "∅",
      "∀",
      "∃",
      "¬",
      "∧",
      "∨",
      "∴",
      "∵",
    ],
  },
  {
    label: "Arrows",
    characters: ["→", "←", "↔", "⇒", "⇐", "⇔", "↑", "↓", "⇌", "⇋"],
  },
  {
    label: "Other",
    characters: [
      "ℓ",
      "ħ",
      "Å",
      "µ",
      "Ω",
      "†",
      "‡",
      "…",
      "⟨",
      "⟩",
      "∠",
      "⊥",
      "∥",
    ],
  },
];

// AdvancedTextbox is for authoring QuestionFormat fields and supports file uploads.
// Student responses use this separate sanitized editor because uploads are not allowed.
const FRQResponseEditor = ({
  value,
  onChange,
  ariaLabel,
}: FRQResponseEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // The caret as it stood the last time the selection was inside this editor.
  // The character palette is a popover: opening it can move focus out of the
  // contentEditable, and a collapsed selection elsewhere would otherwise make
  // the insert land nowhere.
  const savedRangeRef = useRef<Range | null>(null);

  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const sanitizedValue = DOMPurify.sanitize(value);

    if (editor.innerHTML !== sanitizedValue) {
      editor.innerHTML = sanitizedValue;
    }
  }, [value]);

  const rememberSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (
      !editor ||
      !selection?.rangeCount ||
      !editor.contains(selection.anchorNode)
    ) {
      return;
    }

    savedRangeRef.current = selection.getRangeAt(0).cloneRange();
  };

  /** Puts the caret back where it was, or at the end if it was never set. */
  const restoreSelection = () => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    editor.focus();

    const selection = window.getSelection();

    if (!selection) {
      return;
    }

    const savedRange = savedRangeRef.current;
    const range =
      savedRange && editor.contains(savedRange.commonAncestorContainer)
        ? savedRange
        : (() => {
            const endRange = document.createRange();
            endRange.selectNodeContents(editor);
            endRange.collapse(false);
            return endRange;
          })();

    selection.removeAllRanges();
    selection.addRange(range);
  };

  const updateResponse = () => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const sanitizedValue = DOMPurify.sanitize(editor.innerHTML);

    if (editor.innerHTML !== sanitizedValue) {
      editor.innerHTML = sanitizedValue;
    }

    onChange(sanitizedValue);
  };

  const runCommand = (command: string) => {
    editorRef.current?.focus();
    document.execCommand(command);

    rememberSelection();
    updateResponse();
  };

  const insertText = (text: string) => {
    editorRef.current?.focus();
    document.execCommand("insertText", false, text);

    rememberSelection();
    updateResponse();
  };

  /** Inserts at the remembered caret, since the popover holds focus. */
  const insertSpecialCharacter = (character: string) => {
    restoreSelection();
    document.execCommand("insertText", false, character);

    rememberSelection();
    updateResponse();
  };

  const pasteFromClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      insertText(clipboardText);
    } catch {
      window.alert("Clipboard access was blocked. Use Ctrl+V instead.");
    }
  };

  const toolbarButton =
    "rounded p-1 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

  return (
    <div className="overflow-hidden border border-neutral-400 bg-white">
      <div className="flex min-h-9 flex-wrap items-center gap-1 border-b border-neutral-300 px-2">
        <button
          type="button"
          className={toolbarButton}
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
          className={toolbarButton}
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
          className={toolbarButton}
          aria-label="Underline"
          onMouseDown={(event) => {
            event.preventDefault();
            runCommand("underline");
          }}
        >
          <Underline size={17} />
        </button>

        <div className="mx-1 h-6 w-px bg-neutral-300" />

        {/*
          This used to insert a literal "Ω" — the icon is the standard symbol
          for a character palette, so the button read as one and behaved like a
          single-character shortcut instead (#357).
        */}
        <Popover open={paletteOpen} onOpenChange={setPaletteOpen}>
          <PopoverTrigger
            type="button"
            className={toolbarButton}
            aria-label="Insert special character"
            title="Insert special character"
            onMouseDown={(event) => {
              // Keeps the caret in the editor rather than handing focus to the
              // trigger, so the remembered range is the one the student left.
              // Opening is left to the trigger's own click handler — toggling
              // here as well just cancelled it back out.
              event.preventDefault();
              rememberSelection();
            }}
          >
            <Omega size={18} />
          </PopoverTrigger>

          <PopoverContent
            align="start"
            className="max-h-80 w-80 overflow-y-auto"
            // Radix focuses the panel on open, which would collapse the
            // selection this palette needs to insert into.
            onOpenAutoFocus={(event) => event.preventDefault()}
          >
            <div className="space-y-3">
              {SPECIAL_CHARACTER_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {group.label}
                  </p>

                  <div className="mt-1.5 grid grid-cols-10 gap-1">
                    {group.characters.map((character) => (
                      <button
                        key={`${group.label}-${character}`}
                        type="button"
                        aria-label={`Insert ${character}`}
                        title={character}
                        className="flex size-7 items-center justify-center rounded border border-neutral-200 text-sm hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          insertSpecialCharacter(character);
                        }}
                      >
                        {character}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="mx-1 h-6 w-px bg-neutral-300" />

        <button
          type="button"
          className={toolbarButton}
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
          className={toolbarButton}
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
          className={toolbarButton}
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
          className={toolbarButton}
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
          className={toolbarButton}
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
          className={toolbarButton}
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
          className={toolbarButton}
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
          className={toolbarButton}
          aria-label="Bulleted list"
          onMouseDown={(event) => {
            event.preventDefault();
            runCommand("insertUnorderedList");
          }}
        >
          <List size={18} />
        </button>
      </div>

      {/*
        The list classes are load-bearing. `insertUnorderedList` produced a
        correct <ul><li> all along, but Tailwind's preflight resets
        list-style/margin/padding to nothing, so pressing the button appeared to
        do nothing at all (#357). These mirror what RenderContent applies when
        the same markup is read back on the grading and feedback pages, so the
        bullets a student sees while typing are the bullets their grader sees.
      */}
      <div
        ref={editorRef}
        role="textbox"
        aria-label={ariaLabel}
        aria-multiline="true"
        contentEditable
        suppressContentEditableWarning
        className={`min-h-56 p-3 text-sm leading-relaxed outline-none ${RICH_TEXT_LIST_CLASSES}`}
        onInput={() => {
          rememberSelection();
          updateResponse();
        }}
        onKeyUp={rememberSelection}
        onMouseUp={rememberSelection}
        onBlur={rememberSelection}
        onPaste={(event) => {
          event.preventDefault();
          insertText(event.clipboardData.getData("text/plain"));
        }}
      />
    </div>
  );
};

export default FRQResponseEditor;
