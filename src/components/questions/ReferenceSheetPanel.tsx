"use client";

// Reference sheets are also available from FRQs, which do not otherwise load
// KaTeX's stylesheet. Keep the renderer's required CSS with this shared panel
// so mathematical notation is formatted correctly in every test surface.
import "katex/dist/katex.min.css";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { RenderContent } from "@/components/article-creator/custom_questions/RenderAdvancedTextbox";
import type { ReferenceSheet } from "@/types/firestore";

interface ReferenceSheetPanelProps {
  sheet: ReferenceSheet;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Non-destructive overlay for viewing a course's reference sheet while
 * testing. A Radix Sheet gives focus trapping, Escape-to-close, and
 * focus-return-to-trigger for free; it sits above the fixed test Header/
 * Footer (those use z-[1000]/z-20) and never unmounts the test underneath.
 */
const ReferenceSheetPanel = ({
  sheet,
  open,
  onOpenChange,
}: ReferenceSheetPanelProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="z-[2000] flex w-full flex-col overflow-hidden sm:max-w-xl"
      >
        <SheetHeader>
          <SheetTitle>{sheet.title || "Reference Sheet"}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto pr-1 text-black">
          <RenderContent content={sheet.content} origin="question" />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ReferenceSheetPanel;
