"use client";

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
}

/**
 * Non-destructive overlay embedding a College Board-approved Desmos testing
 * calculator. The iframe is only rendered while `open`, so closing the panel
 * (including the auto-close a test renderer does on navigating to a
 * calculator-inactive question) unmounts it and discards whatever the student
 * had entered — the simplest way to guarantee stale calculator state can't
 * carry into a question it isn't permitted on.
 */
const CalculatorPanel = ({
  open,
  onOpenChange,
  calculatorType,
}: CalculatorPanelProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="z-[2000] flex w-full flex-col overflow-hidden sm:max-w-xl"
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
