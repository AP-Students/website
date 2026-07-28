"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronUp, MapPin, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

type BatchVisibility = "public" | "private";

interface FRQNavigationItem {
  id: string;
  title: string;
}

interface FRQEditorFooterProps {
  frqs: FRQNavigationItem[];
  currentFrqIndex: number;
  batchName: string;
  batchVisibility: BatchVisibility;
  onBatchNameChange: (name: string) => void;
  onBatchVisibilityChange: (visibility: BatchVisibility) => void;
  onSelectFrq: (index: number) => void;
  onPrevious: () => void;
  onNext: () => void;
}

const FRQEditorFooter = ({
  frqs,
  currentFrqIndex,
  batchName,
  batchVisibility,
  onBatchNameChange,
  onBatchVisibilityChange,
  onSelectFrq,
  onPrevious,
  onNext,
}: FRQEditorFooterProps) => {
  // Controlled so picking an FRQ closes the panel instead of leaving it parked
  // over the footer, matching frq/FRQFooter.tsx on the other FRQ pages.
  const [navigationOpen, setNavigationOpen] = useState(false);

  const selectFrq = (index: number) => {
    onSelectFrq(index);
    setNavigationOpen(false);
  };

  return (
    <footer className="fixed bottom-0 left-0 z-50 grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 border-t-2 border-gray-300 bg-background px-4 py-2.5 text-foreground">
      <div className="flex min-w-0 items-center gap-2">
        <Input
          aria-label="FRQ batch name"
          value={batchName}
          onChange={(event) => onBatchNameChange(event.target.value)}
          className="h-9 max-w-48 font-medium"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" className="capitalize">
              {batchVisibility}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start">
            <DropdownMenuRadioGroup
              value={batchVisibility}
              onValueChange={(value) => {
                if (value === "public" || value === "private") {
                  onBatchVisibilityChange(value);
                }
              }}
            >
              <DropdownMenuRadioItem value="public">
                Public
              </DropdownMenuRadioItem>

              <DropdownMenuRadioItem value="private">
                Private
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled
          title="Saved FRQs cannot be deleted"
        >
          <Trash2 className="mr-2 size-4" />
          Delete FRQ
        </Button>

        <Popover open={navigationOpen} onOpenChange={setNavigationOpen}>
          <PopoverTrigger className="flex items-center gap-1 rounded-md bg-black py-1 pl-3 pr-1 text-sm font-bold tabular-nums text-white">
            FRQ {currentFrqIndex + 1} of {frqs.length}
            <ChevronUp />
          </PopoverTrigger>

          <PopoverContent side="top" sideOffset={12} className="w-72">
            <p className="font-semibold">Navigate to an FRQ</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Select an FRQ from this batch.
            </p>

            <div className="mt-6 grid grid-cols-6 gap-4">
              {frqs.map((frq, index) => {
                const isCurrent = index === currentFrqIndex;

                return (
                  <button
                    key={frq.id}
                    type="button"
                    aria-label={`Go to ${frq.title}`}
                    onClick={() => selectFrq(index)}
                    className={`relative flex size-8 items-center justify-center border-2 font-medium ${
                      isCurrent
                        ? "border-transparent bg-[#2a47bb] text-white"
                        : "border-dotted border-gray-400 text-[#2a47bb] hover:bg-blue-50"
                    }`}
                  >
                    {index + 1}

                    {isCurrent && (
                      <MapPin className="absolute -top-5 fill-white stroke-black" />
                    )}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        <Button
          type="button"
          variant="outline"
          disabled
          title="Creating FRQs is not implemented yet"
        >
          <Plus className="mr-2 size-4" />
          Create FRQ
        </Button>
      </div>

      <div className="justify-self-end">
        <button
          type="button"
          onClick={onPrevious}
          disabled={currentFrqIndex === 0}
          className="rounded-full bg-[#294ad1] px-6 py-2 font-bold text-white hover:bg-[#2a47bb] disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          Back
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={currentFrqIndex === frqs.length - 1}
          className="ml-3 rounded-full bg-[#294ad1] px-6 py-2 font-bold text-white hover:bg-[#2a47bb] disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          Next
        </button>
      </div>
    </footer>
  );
};

export default FRQEditorFooter;
