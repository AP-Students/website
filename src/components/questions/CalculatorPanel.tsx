"use client";

import { useRef, type RefObject } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  CALCULATOR_TYPE_LABELS,
  DESMOS_CALCULATOR_URLS,
  type CalculatorType,
} from "@/lib/calculator";

interface CalculatorPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calculatorType: CalculatorType;
  /** The control that opens the panel. Focus is handed back to it on close. */
  triggerRef?: RefObject<HTMLElement>;
}

/**
 * Non-destructive side panel embedding a College Board-approved Desmos testing
 * calculator. The iframe is only rendered while `open`, so closing the panel
 * (including the auto-close a test renderer does on navigating to a
 * calculator-inactive question) unmounts it and discards whatever the student
 * had entered — the simplest way to guarantee stale calculator state can't
 * carry into a question it isn't permitted on.
 *
 * Deliberately non-modal: a calculator is used *while* reading the question and
 * entering an answer, so the rest of the test has to stay live behind it. A
 * modal sheet puts `pointer-events: none` on the body, which would mean a
 * student had to close the calculator to pick an answer or move to the next
 * question — and would also make the navigate-away auto-close unreachable,
 * because navigating would be impossible in the first place.
 */
const CalculatorPanel = ({
  open,
  onOpenChange,
  calculatorType,
  triggerRef,
}: CalculatorPanelProps) => {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        ref={contentRef}
        side="right"
        overlay={false}
        // `bottom-14` clears the fixed test footer so the question navigation
        // stays clickable while the calculator is up; `inset-y-0 h-full` from
        // the sheet variant would sit on top of it.
        className="bottom-14 top-0 z-[2000] flex h-auto w-full flex-col overflow-hidden border-l-2 shadow-2xl sm:max-w-xl"
        tabIndex={-1}
        // Radix focuses the first tabbable node on open, which here is the
        // Desmos iframe. Focus inside a cross-origin frame never reaches this
        // document, so Escape would stop working the moment the panel opened
        // and a keyboard user would have no way back out. Focusing the panel
        // itself keeps the dismiss handler reachable and still moves screen
        // reader focus into the calculator.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          contentRef.current?.focus();
        }}
        // Clicking the passage, an answer choice, or Next is the normal thing
        // to do with a calculator open, so an outside interaction must not
        // dismiss it. Escape and the close button still do.
        onInteractOutside={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => {
          event.preventDefault();

          // Only reclaim focus if the panel still held it. On the auto-close
          // path the student closed it by navigating, so focus is already on
          // whatever they clicked and yanking it back would be a surprise.
          const active = document.activeElement;
          const panel = contentRef.current;

          if (
            !active ||
            active === document.body ||
            (panel?.contains(active) ?? false)
          ) {
            triggerRef?.current?.focus();
          }
        }}
      >
        <SheetHeader>
          <SheetTitle>
            {CALCULATOR_TYPE_LABELS[calculatorType]} Calculator
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-hidden">
          {open && (
            <iframe
              title={`${CALCULATOR_TYPE_LABELS[calculatorType]} calculator`}
              src={DESMOS_CALCULATOR_URLS[calculatorType]}
              className="h-full w-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CalculatorPanel;
