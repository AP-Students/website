"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { TeamMember } from "@/types/team";

interface TeamMemberHexProps {
  member: TeamMember;
  className?: string;
}

export default function TeamMemberHex({ member, className }: TeamMemberHexProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn("inline-block transition-transform duration-700 ease-in-out", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transformStyle: 'preserve-3d',
        transform: isHovered ? 'rotateY(180deg)' : 'rotateY(0deg)'
      }}
    >
      <div className="relative w-[150px] h-[150px]">
        {/* Front face - Profile Picture with Beehive Outline */}
        <div
          className="absolute inset-0 w-full h-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg hover:shadow-xl transition-shadow duration-300"
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            backfaceVisibility: 'hidden'
          }}
        >
          {/* Inner hexagon for the profile picture */}
          <div
            className="absolute inset-[8px] bg-white dark:bg-gray-100 flex items-center justify-center overflow-hidden"
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
            }}
          >
            {/* Default profile picture */}
            <div className="w-full h-full flex items-center justify-center">
              <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-600">
                {/* Default avatar icon */}
                <svg
                  className="w-full h-full text-gray-500 dark:text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Back face - Placeholder Name and Title */}
        <div
          className="absolute inset-0 w-full h-full bg-gradient-to-br from-yellow-500/95 to-amber-600/95 shadow-lg"
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <div
            className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-white"
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
            }}
          >
            <h3 className="font-bold text-sm mb-1 leading-tight drop-shadow-sm">
              Placeholder Name
            </h3>
            <p className="text-xs opacity-90 leading-tight drop-shadow-sm">
              Placeholder Title
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}