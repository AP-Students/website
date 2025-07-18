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
      className={cn("relative group", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="relative w-36 h-36 transition-transform duration-700 ease-in-out transform-gpu"
        style={{
          transformStyle: 'preserve-3d',
          transform: isHovered ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        {/* Front face - Image */}
        <div
          className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 shadow-lg hover:shadow-xl transition-shadow duration-300"
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            backfaceVisibility: 'hidden'
          }}
        >
          <div
            className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden"
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
            }}
          >
            {/* Placeholder for image - you can replace this with actual images later */}
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <div className="text-white text-2xl font-bold">
                {member.name.split(' ').map(n => n[0]).join('')}
              </div>
            </div>
          </div>
        </div>

        {/* Back face - Info */}
        <div
          className="absolute inset-0 w-full h-full bg-gradient-to-br from-secondary/90 to-secondary shadow-lg"
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <div
            className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-secondary-foreground"
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
            }}
          >
            <h3 className="font-bold text-sm mb-1 leading-tight">
              {member.name}
            </h3>
            <p className="text-xs opacity-90 leading-tight">
              {member.position}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}