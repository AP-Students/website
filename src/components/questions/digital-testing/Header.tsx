import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronUp, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  timeRemaining: number; // seconds
  setSubmitted: (value: boolean) => void;
  submitted: boolean;
}

const Header: React.FC<HeaderProps> = ({
  timeRemaining,
  setSubmitted,
  submitted,
}) => {
  const pathname = usePathname();
  const [showTimer, setShowTimer] = useState(true);
  const [remainingTime, setRemainingTime] = useState(timeRemaining);
  const [showDirections, setShowDirections] = useState(true);
  const directionsRef = useRef<HTMLDivElement>(null); // Ref for detecting outside clicks
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  // Start the countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingTime((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer); // Stop at 0
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (remainingTime <= 0) {
      setSubmitted(true);
    }
  }, [remainingTime, setSubmitted]);

  useEffect(() => {
    if (submitted) {
      setShowTimer(false);
    }
  }, [submitted]);

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
    <header className="fixed left-0 top-0 z-[1000] flex w-full items-center justify-between border-b-2 border-gray-300 p-2.5">
      <div className="flex w-full items-center justify-between">
        <p>Unit Test</p>
        <button
          ref={toggleButtonRef}
          onClick={handleToggleDirections}
          className="ml-4 flex items-center text-blue-500 hover:underline"
        >
          Directions
          {showDirections ? <ChevronUp /> : <ChevronDown />}
        </button>
        <div className="flex flex-1 items-center justify-center gap-2">
          {(showTimer || (remainingTime < 5 * 60 && !submitted)) && (
            <p
              className={cn(
                "text-xl font-bold",
                remainingTime < 5 * 60 && "text-red-500",
              )}
            >
              {formatTime(remainingTime)}
            </p>
          )}
          {remainingTime >= 5 * 60 && (
            <button
              onClick={() => {
                setShowTimer(!showTimer);
              }}
              className="rounded-full border px-2 transition-colors hover:bg-gray-200"
            >
              {showTimer ? "Hide Timer" : "Show Timer"}
            </button>
          )}
        </div>
        <a
          href={pathname.split("/").slice(0, 3).join("/")}
          onClick={(e) => {
            if (
              !confirm(
                "Exit the test? All progress will be lost. FiveHive does not currently save your progress.",
              )
            ) {
              e.preventDefault();
            }
          }}
          className="ml-16 flex items-center gap-1 hover:underline"
        >
          Exit Test <LogOut />
        </a>
      </div>

      {showDirections && (
        <div
          ref={directionsRef}
          className="absolute left-0 right-0 top-12 z-[9000] border-2 border-gray-300 bg-white p-5 shadow-lg"
        >
          <p>
            Read each passage and question carefully, and then choose the best
            answer to the question based on the passage(s).
          </p>
          <p>
            All questions in this section are multiple-choice with four answer
            choices. Each question has a single best answer.
          </p>
          <button
            onClick={() => setShowDirections(false)}
            className="mt-4 font-semibold text-yellow-600"
          >
            Close
          </button>
        </div>
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
  const seconds = (time % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};
