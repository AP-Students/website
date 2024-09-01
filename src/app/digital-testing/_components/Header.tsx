import React from "react";
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
  return (
    <header className="fixed left-0 top-0 z-[1000] flex w-full items-center justify-between border-b-2 border-gray-300 p-2.5">
      <div className="flex w-full items-center justify-between">
        <div className="flex-1">
          {examName} - {moduleName}
        </div>
        <div className="flex-1 text-center text-xl font-bold">
          {Math.floor(timeRemaining / 3600)
            .toString()
            .padStart(2, "0")}
          :
          {Math.floor((timeRemaining % 3600) / 60)
            .toString()
            .padStart(2, "0")}
          :{(timeRemaining % 60).toString().padStart(2, "0")}
        </div>
        <div className="flex-1 p-2.5"></div>
        <ToolsDropdown /> {/* SWITCH TO ACTUAL TOOLS */}
      </div>
    </header>
  );
};

export default Header;
