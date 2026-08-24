"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronUp } from "lucide-react";
import { useState } from "react";

type FRQVisibility = "public" | "private";

interface FRQPartSummary {
  id: string;
  label: string;
}

interface FRQEditorFooterProps {
  parts: FRQPartSummary[];
  frqName: string;
  visibility: FRQVisibility;
  hasUnsavedChanges: boolean;
  /**
   * Reveals and scrolls to a part. The editor owns this rather than the footer
   * because a part sits inside its question's accordion panel: while that
   * question is collapsed the part is not in the DOM at all, so the footer
   * cannot find it to scroll to. The editor opens both first.
   */
  onSelectPart: (partId: string) => void;
}

/**
 * Status bar for the FRQ editor. Each FRQ is its own Firestore document, so
 * this navigates the parts of the open FRQ rather than a batch of FRQs; adding
 * and removing whole FRQs belongs to the admin subject page that owns the list.
 */
const FRQEditorFooter = ({
  parts,
  frqName,
  visibility,
  hasUnsavedChanges,
  onSelectPart,
}: FRQEditorFooterProps) => {
  // Controlled so picking a part closes the panel instead of leaving it parked
  // over the footer, matching frq/FRQFooter.tsx on the other FRQ pages.
  const [navigationOpen, setNavigationOpen] = useState(false);

  const selectPart = (partId: string) => {
    setNavigationOpen(false);
    onSelectPart(partId);
  };

  return (
    <footer className="fixed bottom-0 left-0 z-50 grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 border-t-2 border-gray-300 bg-background px-4 py-2.5 text-foreground">
      <div className="flex min-w-0 items-center gap-4">
        <p className="truncate font-medium" title={frqName}>
          {frqName}
        </p>

        <p className="shrink-0 text-sm text-muted-foreground">
          Visibility:{" "}
          <span className="capitalize text-foreground">{visibility}</span>
        </p>
      </div>

      <div className="flex items-center justify-center gap-2">
        <Popover open={navigationOpen} onOpenChange={setNavigationOpen}>
          <PopoverTrigger className="flex items-center gap-1 rounded-md bg-black py-1 pl-3 pr-1 text-sm font-bold tabular-nums text-white">
            {parts.length} {parts.length === 1 ? "part" : "parts"}
            <ChevronUp />
          </PopoverTrigger>

          <PopoverContent side="top" sideOffset={12} className="w-72">
            <p className="font-semibold">Jump to a part</p>

            {parts.length === 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">
                This FRQ has no parts yet.
              </p>
            ) : (
              <div className="mt-6 grid grid-cols-6 gap-4">
                {parts.map((part) => (
                  <button
                    key={part.id}
                    type="button"
                    aria-label={`Go to part ${part.label}`}
                    onClick={() => selectPart(part.id)}
                    className="flex size-8 items-center justify-center border-2 border-dotted border-gray-400 font-medium text-[#2a47bb] hover:bg-blue-50"
                  >
                    {part.label}
                  </button>
                ))}
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      <div className="justify-self-end text-sm">
        {hasUnsavedChanges ? (
          <span className="font-medium text-amber-600">Unsaved changes</span>
        ) : (
          <span className="text-muted-foreground">All changes saved</span>
        )}
      </div>
    </footer>
  );
};

export default FRQEditorFooter;
