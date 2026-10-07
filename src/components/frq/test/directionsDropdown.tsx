"use client";

import { RenderContent } from "@/components/article-creator/custom_questions/RenderAdvancedTextbox";
import { toQuestionInput } from "@/lib/frq/template";
import type { QuestionFile } from "@/types/questions";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef } from "react";

const PANEL_ID = "frq-directions";

type DirectionsDropdownProps = {
  directions: string;
  directionsFiles?: QuestionFile[];
  /**
   * Controlled so the test page owns it: the header unmounts while the review
   * page is showing, and local state would reopen the panel on every return.
   */
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * The exam-wide directions behind a "Directions" toggle in the test header,
 * the way the MCQ test header and AP's own test UI show them. The panel hangs
 * from the header, so it must render inside a positioned (`relative`) header.
 */
const DirectionsDropdown = ({
  directions,
  directionsFiles,
  open,
  onOpenChange,
}: DirectionsDropdownProps) => {
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;

      // The toggle is excluded or its own click would close and then reopen.
      if (
        !panelRef.current?.contains(target) &&
        !toggleRef.current?.contains(target)
      ) {
        onOpenChange(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // An Escape aimed at the calculator or reference sheet (both dialogs)
      // closes that panel only, not the directions behind it as well.
      if (
        event.key !== "Escape" ||
        (event.target as Element | null)?.closest?.('[role="dialog"]')
      ) {
        return;
      }

      // Only pull focus back when it was in the panel. A student typing in a
      // response box who presses Escape should keep their cursor.
      const focusWasInPanel = panelRef.current?.contains(
        document.activeElement,
      );
      onOpenChange(false);
      if (focusWasInPanel) {
        toggleRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        // The panel unmounts when closed, so only point at it while it exists.
        aria-controls={open ? PANEL_ID : undefined}
        onClick={() => onOpenChange(!open)}
        className="mt-1 flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
      >
        Directions
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        // z-40 keeps it under the time-up (z-50) and submit (z-[60]) modals,
        // the z-50 footer, and the calculator/reference sheets.
        <div
          ref={panelRef}
          id={PANEL_ID}
          role="region"
          aria-label="Directions"
          className="absolute left-0 right-0 top-full z-40 max-h-[60vh] overflow-y-auto border-2 border-gray-300 bg-white p-5 shadow-lg"
        >
          <RenderContent
            content={toQuestionInput(directions, directionsFiles)}
            origin="question"
          />
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              // The Close button unmounts with the panel; without this,
              // keyboard focus would drop to the top of the document.
              toggleRef.current?.focus();
            }}
            className="mt-4 font-semibold text-yellow-600"
          >
            Close
          </button>
        </div>
      )}
    </>
  );
};

export default DirectionsDropdown;
