"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export interface Highlight {
  id: string;
  color: string;
  content: string;
}

interface HighlighterProps {
  className?: string;
  highlights: Highlight[];
  onUpdateHighlights: (newHighlights: Highlight[]) => void;
  children: ReactNode;
}

export default function Highlighter({
  className = "",
  highlights,
  onUpdateHighlights,
  children,
}: HighlighterProps) {
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const currentSelectionRef = useRef<Range | null>(null);

  const colors = {
    yellow: "bg-yellow-200",
    blue: "bg-blue-200",
    pink: "bg-pink-200",
  };

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || !containerRef.current) return;
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!range || range.collapsed) {
      setShowToolbar(false);
      return;
    }

    if (!containerRef.current.contains(range.commonAncestorContainer)) {
      setShowToolbar(false);
      return;
    }

    const rangeRect = range.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    setToolbarPosition({
      top: rangeRect.top - containerRect.top - 60, // Adjusted for visibility
      left: rangeRect.left - containerRect.left + rangeRect.width / 2 - 50,
    });

    currentSelectionRef.current = range.cloneRange();
    setShowToolbar(true);
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    if (!event.defaultPrevented) {
      setShowToolbar(false);
      currentSelectionRef.current = null;
    }
  };

  const addHighlight = (color: string) => {
    if (!currentSelectionRef.current) return;

    const range = currentSelectionRef.current;
    const rects = Array.from(range.getClientRects()); // Get all line fragments

    const id = Math.random().toString(36).slice(2, 9); // Generate a unique ID

    rects.forEach((rect) => {
      // Create a highlight overlay for each line fragment
      const highlightOverlay = document.createElement("div");
      highlightOverlay.className = `${colors[color as keyof typeof colors]} absolute rounded opacity-50 group`;
      highlightOverlay.style.top = `${rect.top + window.scrollY}px`;
      highlightOverlay.style.left = `${rect.left + window.scrollX}px`;
      highlightOverlay.style.width = `${rect.width}px`;
      highlightOverlay.style.height = `${rect.height}px`;
      highlightOverlay.style.zIndex = "50"; // Ensure the highlight is above the content
      highlightOverlay.style.pointerEvents = "auto"; // Ensure the button can be clicked
      highlightOverlay.setAttribute("data-highlight-id", id);

      // Create the delete button
      const button = document.createElement("button");
      button.className =
        "absolute -top-2 -right-2 h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-white hidden group-hover:flex hover:bg-gray-900";
      button.style.zIndex = "60"; // Ensure the button is on top
      button.innerHTML = `<span class="sr-only">Remove highlight</span>`;

      const icon = document.createElement("div");
      icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>`;
      button.appendChild(icon);

      // Attach the click handler to remove the highlight
      button.addEventListener("click", () => removeHighlight(id));

      // Add the button inside the highlight overlay
      highlightOverlay.appendChild(button);

      // Append the highlight overlay to the document body
      document.body.appendChild(highlightOverlay);
    });

    // Store the highlight in state
    const newHighlight: Highlight = { id, color, content: range.toString() };
    onUpdateHighlights([...highlights, newHighlight]);

    // Reset the toolbar and selection
    setShowToolbar(false);
    window.getSelection()?.removeAllRanges();
    currentSelectionRef.current = null;
  };

  const removeHighlight = (id: string) => {
    const overlays = document.querySelectorAll(`[data-highlight-id="${id}"]`);
    overlays.forEach((overlay) => overlay.remove()); // Remove all fragments of the highlight

    // Update the highlights state to remove the deleted highlight
    onUpdateHighlights(highlights.filter((h) => h.id !== id));
  };

  return (
    <div
      className={`relative ${className}`}
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div className="prose max-w-none">{children}</div>

      {showToolbar && (
        <div
          className="absolute z-50 flex gap-2 rounded-lg border bg-white p-2 shadow-lg"
          style={{
            top: `${Math.max(0, toolbarPosition.top)}px`,
            left: `${Math.max(0, toolbarPosition.left)}px`,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {Object.entries(colors).map(([color, className]) => (
            <button
              key={color}
              onClick={() => addHighlight(color)}
              className={`h-6 w-6 rounded-full ${className} hover:ring-2 hover:ring-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400`}
              aria-label={`Highlight in ${color}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
