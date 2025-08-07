"use client";

import { useState } from "react";
import { TeamMember } from "@/types/team";

const DEFAULT_IMAGE = "/team/default-profile.png";
import Image from 'next/image';

<Image src="/team/default-profile.png" width={100} height={100} alt="Profile" />

const HEX_POINTS = "50,0 98,25 98,75 50,100 2,75 2,25";


export default function TeamMemberHex({ member }: { member: TeamMember }) {
  const [hovered, setHovered] = useState(false);
  const imgSrc = member.image || DEFAULT_IMAGE;
  const clipId = `hexClip-${member.id}`;

  return (
    <div
      className="relative inline-block w-40 h-40"
      style={{ perspective: "1000px" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="w-full h-full transition-transform duration-700"
        style={{
          transformStyle: "preserve-3d",
          transform: hovered ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          style={{ backfaceVisibility: "hidden" }}
        >
          <defs>
            <clipPath id={clipId}>
              <polygon points={HEX_POINTS} />
            </clipPath>
          </defs>
          <image
            x="0"
            y="0"
            width="100"
            height="100"
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${clipId})`}
            href={imgSrc}
            xlinkHref={imgSrc}
          />
          <polygon
            points={HEX_POINTS}
            fill="none"
            stroke="#F6C13D"
            strokeWidth={6}
          />
        </svg>

        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <polygon
            points={HEX_POINTS}
            fill="#EF7A3D"
            stroke="#F6C13D"
            strokeWidth={6}
          />
        </svg>

        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-white px-2"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            clipPath: `polygon(${HEX_POINTS.split(' ').join(',')})`
          }}
        >
          <h3 className="font-bold text-sm text-center">
            {member.name}
          </h3>
          <p className="text-xs mt-1 text-center">
            {member.position}
          </p>
        </div>
      </div>
    </div>
  );
}
