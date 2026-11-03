"use client";

import DirectionsDropdown from "@/components/frq/test/directionsDropdown";
import type { QuestionInput } from "@/types/questions";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function Header({
  earnedPoints,
  totalPoints,
  directions,
}: {
  earnedPoints: number;
  totalPoints: number;
  /**
   * The exam-wide directions, behind a toggle. Omitted when they are blank or
   * when they belong in the left pane, as a legacy document's do.
   */
  directions?: QuestionInput;
}) {
  // Closed on arrival, unlike the test page: the student already read these
  // while sitting the exam, and an open panel would cover the stimulus they
  // came back to look at.
  const [showDirections, setShowDirections] = useState(false);

  return (
    // A grid rather than absolutely placed corners: the directions panel hangs
    // from the nearest positioned ancestor, and that has to be this full-width
    // header, not a narrow wrapper around the toggle.
    <header className="fixed left-0 top-0 z-50 grid h-16 w-full grid-cols-3 items-center border-b-2 border-dashed border-gray-500 bg-white px-8">
      <div>
        {directions && (
          <DirectionsDropdown
            directions={directions.value}
            directionsFiles={directions.files}
            open={showDirections}
            onOpenChange={setShowDirections}
          />
        )}
      </div>

      <p className="text-center font-semibold">
        {earnedPoints}/{totalPoints} Points Earned
      </p>

      {/* My FRQ Results is the list this page is opened from. */}
      <Link
        href="/frq-feedback"
        className="flex items-center gap-2 justify-self-end text-right font-semibold text-red-500 hover:underline"
      >
        <LogOut className="size-5 shrink-0" />
        <span>
          {/* Dropped on narrow screens so the label fits the 64px header. */}
          <span className="hidden md:inline">Return to </span>
          My FRQ Results
        </span>
      </Link>
    </header>
  );
}
