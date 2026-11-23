import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { BookOpen, ChevronDown, ChevronUp, LogOut, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import katex from "katex";
import {
  decodeEntities,
  katexMacros,
} from "@/components/article-creator/Renderer";
import ReferenceSheetPanel from "@/components/questions/ReferenceSheetPanel";
import PausedOverlay from "@/components/questions/PausedOverlay";
import { useTestTimer } from "@/components/hooks/useTestTimer";
import type { ReferenceSheet } from "@/types/firestore";

interface HeaderProps {
  timeRemaining: number; // seconds
  setSubmitted: (value: boolean) => void;
  submitted: boolean;
  directions?: string;
  /** Whether this test has a reference sheet assigned, regardless of whether it loaded. */
  referenceSheetEnabled?: boolean;
  /**
   * The resolved sheet content, or null while `referenceSheetEnabled` is true if
   * the assigned sheet could not be loaded (deleted, or a fetch error). That
   * distinction is what lets the button show "unavailable" instead of just
   * vanishing, so a real failure doesn't look identical to the tool never
   * having been turned on.
   */
  referenceSheet?: ReferenceSheet | null;
  /** Called with the seconds left whenever the countdown moves. */
  onTimeChange?: (secondsRemaining: number) => void;
  /** Whether the student's answers and time left are being saved. */
  progressSaved?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  timeRemaining,
  setSubmitted,
  submitted,
  directions,
  referenceSheetEnabled = false,
  referenceSheet,
  onTimeChange,
  progressSaved = false,
}) => {
  const [showReferenceSheet, setShowReferenceSheet] = useState(false);
  const [showReferenceSheetError, setShowReferenceSheetError] =
    useState(false);
  const referenceButtonRef = useRef<HTMLButtonElement>(null);
  const referenceSheetUnavailable = referenceSheetEnabled && !referenceSheet;
  const pathname = usePathname() ?? "";
  const [showTimer, setShowTimer] = useState(true);
  const timer = useTestTimer(timeRemaining, submitted);
  const remainingTime = timer.remaining;
  const [showDirections, setShowDirections] = useState(true);
  const directionsRef = useRef<HTMLDivElement>(null); // Ref for detecting outside clicks
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  // The test hands itself in when time runs out.
  useEffect(() => {
    if (timer.timeUp) {
      setSubmitted(true);
    }
  }, [timer.timeUp, setSubmitted]);

  useEffect(() => {
    onTimeChange?.(remainingTime);
  }, [remainingTime, onTimeChange]);

  // Close directions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        directionsRef.current &&
        !directionsRef.current.contains(event.target as Node) &&
        toggleButtonRef.current &&
        !toggleButtonRef.current.contains(event.target as Node)
      ) {
        setShowDirections(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggleDirections = () => {
    setShowDirections(!showDirections);
  };

  return (
    <header className="fixed left-0 top-0 z-[1000] flex w-full items-center justify-between border-b-2 border-gray-300 p-2.5 text-sm sm:text-base">
      <div className="flex w-full items-center justify-between">
        <p className="hidden sm:block">Unit Test</p>
        <button
          ref={toggleButtonRef}
          onClick={handleToggleDirections}
          className="flex items-center text-blue-500 hover:underline sm:ml-4"
        >
          Directions
          {showDirections ? (
            <ChevronUp className="size-4 sm:size-6" />
          ) : (
            <ChevronDown className="size-4 sm:size-6" />
          )}
        </button>
        {referenceSheetEnabled && (
          <button
            ref={referenceButtonRef}
            onClick={() =>
              referenceSheetUnavailable
                ? setShowReferenceSheetError(true)
                : setShowReferenceSheet(true)
            }
            aria-disabled={referenceSheetUnavailable}
            title={
              referenceSheetUnavailable
                ? "This reference sheet could not be loaded."
                : undefined
            }
            className={cn(
              "ml-4 flex items-center gap-1",
              referenceSheetUnavailable
                ? "text-gray-400 hover:underline"
                : "text-blue-500 hover:underline",
            )}
          >
            <BookOpen size={18} />
            Reference Sheet
          </button>
        )}
        <div className="flex flex-1 items-center justify-center gap-1 sm:gap-2">
          {!submitted && (showTimer || remainingTime < 5 * 60) && (
            <p
              className={cn(
                "text-base font-bold sm:text-xl",
                remainingTime < 5 * 60 && "text-red-500",
              )}
            >
              {formatTime(remainingTime)}
            </p>
          )}
          {!submitted && (
            <button
              onClick={timer.pause}
              aria-label="Pause"
              className="rounded-full border px-2 py-0.5 transition-colors hover:bg-gray-200 sm:py-0"
            >
              <Pause className="size-4 sm:hidden" aria-hidden="true" />
              <span className="hidden sm:inline">Pause</span>
            </button>
          )}
          {!submitted && remainingTime >= 5 * 60 && (
            <button
              onClick={() => {
                setShowTimer(!showTimer);
              }}
              aria-label={showTimer ? "Hide Timer" : "Show Timer"}
              className="rounded-full border px-2 transition-colors hover:bg-gray-200"
            >
              {showTimer ? "Hide" : "Show"}
              <span className="hidden sm:inline"> Timer</span>
            </button>
          )}
        </div>
        <a
          href={pathname.split("/").slice(0, 3).join("/")}
          onClick={(e) => {
            if (
              !confirm(
                progressSaved
                  ? "Exit the test? Your answers and time left are saved every few seconds, so you can pick up where you left off from your dashboard."
                  : "Exit the test? All progress will be lost.",
              )
            ) {
              e.preventDefault();
            }
          }}
          aria-label="Exit Test"
          className="ml-2 flex items-center gap-1 hover:underline sm:ml-16"
        >
          Exit<span className="hidden sm:inline"> Test</span>{" "}
          <LogOut className="size-4 sm:size-6" />
        </a>
      </div>

      {showDirections && (
        <div
          ref={directionsRef}
          className="absolute left-0 right-0 top-12 z-[9000] border-2 border-gray-300 bg-white p-5 shadow-lg"
        >
          <p>
            {directions ? (
              <div className="whitespace-pre-wrap">
                {decodeEntities(directions)
                  .split(/(\$@[^$]+\$)/g)
                  .map((line, lineIndex) => {
                    if (line.endsWith("$")) {
                      return (
                        <span
                          key={`latex-${lineIndex}`}
                          dangerouslySetInnerHTML={{
                            __html: katex.renderToString(line.slice(2, -1), {
                              throwOnError: false,
                              macros: katexMacros,
                            }),
                          }}
                        ></span>
                      );
                    }
                    return <span key={`text-${lineIndex}`}>{line}</span>;
                  })}
              </div>
            ) : (
              "Read each passage and question carefully, and then choose the best answer to the question based on the passage(s).All questions in this section are multiple-choice with four answer choices. Each question has a single best answer."
            )}
          </p>
          <button
            onClick={() => setShowDirections(false)}
            className="mt-4 font-semibold text-yellow-600"
          >
            Close
          </button>
        </div>
      )}

      {showReferenceSheetError && (
        <div
          role="alertdialog"
          aria-label="Reference sheet unavailable"
          className="absolute left-0 right-0 top-12 z-[9000] border-2 border-red-300 bg-red-50 p-5 text-red-700 shadow-lg"
        >
          <p>
            The reference sheet for this test could not be loaded. Your
            answers are unaffected — you can continue the test without it.
          </p>
          <button
            onClick={() => setShowReferenceSheetError(false)}
            className="mt-4 font-semibold text-red-800"
          >
            Close
          </button>
        </div>
      )}

      {referenceSheet && (
        <ReferenceSheetPanel
          sheet={referenceSheet}
          open={showReferenceSheet}
          onOpenChange={setShowReferenceSheet}
        />
      )}

      {timer.paused && !submitted && (
        <PausedOverlay
          timeLeft={formatTime(remainingTime)}
          onResume={timer.resume}
        />
      )}
    </header>
  );
};

export default Header;

const formatTime = (time: number) => {
  const hours = Math.floor(time / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((time % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(time % 60)
    .toString()
    .padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};
