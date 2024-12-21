import React, { useState, useRef, useEffect } from "react";

interface HeaderProps {
  timeRemaining: number; // In seconds
  setSubmittedAnswers: (value: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({
  timeRemaining,
  setSubmittedAnswers,
}) => {
  const [remainingTime, setRemainingTime] = useState(timeRemaining);
  const [showDirections, setShowDirections] = useState(true); // State to control directions visibility
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

    return () => clearInterval(timer); // Clean up interval on component unmount
  }, []);

  useEffect(() => {
    if (remainingTime <= 0) {
      setSubmittedAnswers(true);
    }
  }, [remainingTime]);

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

  // Toggle directions visibility when clicking the "Directions" button
  const handleToggleDirections = () => {
    setShowDirections(!showDirections);
  };

  return (
    <header className="fixed left-0 top-0 z-[1000] flex w-full items-center justify-between border-b-2 border-gray-300 p-2.5">
      <div className="flex w-full items-center justify-between">
        <div className="flex-1">Unit Test</div>
        <div className="flex-1 text-center text-xl font-bold">
          {formatTime(remainingTime)}
        </div>
        <div className="flex-1 text-right">
          <button
            ref={toggleButtonRef}
            onClick={handleToggleDirections}
            className="text-blue-500 hover:underline"
          >
            Directions <span>{showDirections ? "▲" : "▼"}</span>
          </button>
        </div>
      </div>

      {/* Directions panel */}
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

// Format time for display
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
