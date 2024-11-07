import React, { useState, useRef, useEffect } from "react";
import ToolsDropdown from "./ToolsDropdown";

interface HeaderProps {
  examName: string;
  moduleName: string;
  timeRemaining: number;
}

const Header: React.FC<HeaderProps> = ({
  examName,
  moduleName,
  timeRemaining,
}) => {
  const [showDirections, setShowDirections] = useState(true); // State to control directions visibility
  const directionsRef = useRef<HTMLDivElement>(null); // Ref for detecting outside clicks

  // Close directions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (directionsRef.current && !directionsRef.current.contains(event.target as Node)) {
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
        <div className="flex-1">
          {examName} - {moduleName}
        </div>
        <div className="flex-1 text-center text-xl font-bold">
          {Math.floor(timeRemaining / 3600).toString().padStart(2, "0")}:
          {Math.floor((timeRemaining % 3600) / 60).toString().padStart(2, "0")}:
          {(timeRemaining % 60).toString().padStart(2, "0")}
        </div>
        <div className="flex-1 text-right">
          <button
            onClick={handleToggleDirections}
            className="text-blue-500 hover:underline"
          >
            Directions{" "}
            <span>{showDirections ? "▲" : "▼"}</span>
          </button>
        </div>
      </div>

      {/* Directions panel */}
      {showDirections && (
        <div
          ref={directionsRef}
          className="absolute top-12 left-0 right-0 z-[9000] bg-white p-5 border-2 border-gray-300 shadow-lg"
        >
          <p>
            The questions in this section address a number of important reading
            and writing skills. Each question includes one or more passages,
            which may include a table or graph. Read each passage and question
            carefully, and then choose the best answer to the question based on
            the passage(s).
          </p>
          <p>
            All questions in this section are multiple-choice with four answer
            choices. Each question has a single best answer.
          </p>
          <button
            onClick={() => setShowDirections(false)}
            className="mt-4 text-yellow-600 font-semibold"
          >
            Close
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
