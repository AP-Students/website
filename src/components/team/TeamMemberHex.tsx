"use client";

import Image from "next/image";
import { useState } from "react";
import type { TeamMember } from "@/types/team";

const DEFAULT_IMAGE = "/team/default-profile.png";

// --- Configuration ---
const PROFILE_PICTURE_SIZE = 80;

// Hex outline points, expressed as percentages of the tile's 0-100 box.
const HEX_POINTS: [number, number][] = [
  [50, 10],
  [84.64, 30],
  [84.64, 70],
  [50, 90],
  [15.36, 70],
  [15.36, 30],
];
const HEX_POINTS_STR = HEX_POINTS.map(([x, y]) => `${x},${y}`).join(" ");
export const HEX_CLIP_PATH = `polygon(${HEX_POINTS.map(
  ([x, y]) => `${x}% ${y}%`,
).join(", ")})`;

function formatTextToLines(text: string, maxCharsPerLine = 15): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const potentialLine = currentLine ? `${currentLine} ${word}` : word;
    if (potentialLine.length <= maxCharsPerLine) {
      currentLine = potentialLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

export default function TeamMemberHex({ member }: { member: TeamMember }) {
  const [hovered, setHovered] = useState(false);
  const imgSrc = member.image || DEFAULT_IMAGE;

  const imageSize = PROFILE_PICTURE_SIZE;
  const imageOffset = (100 - imageSize) / 2;

  // The hex outline above is defined in the tile's outer 0-100% coordinate
  // space, but the photo itself only occupies the inset box
  // [imageOffset, imageOffset + imageSize] on each axis. Remap the same hex
  // points into the photo's own 0-100% box so the clipped photo lines up
  // exactly with the outline drawn on top of it.
  const imageClipPath = `polygon(${HEX_POINTS.map(
    ([x, y]) =>
      `${((x - imageOffset) / imageSize) * 100}% ${
        ((y - imageOffset) / imageSize) * 100
      }%`,
  ).join(", ")})`;

  const nameLines = formatTextToLines(member.name);
  const positionLines = formatTextToLines(member.position);

  return (
    <div
      className="relative w-full h-full flex items-center justify-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* PROFILE PHOTO, clipped to the hex outline. next/image serves a
          resized/compressed version and lazy-loads it, instead of every one
          of the ~75 full-resolution team photos (several MB each) loading
          up front like the old raw <image href> did. */}
      <div
        className="absolute overflow-hidden"
        style={{
          left: `${imageOffset}%`,
          top: `${imageOffset}%`,
          width: `${imageSize}%`,
          height: `${imageSize}%`,
          clipPath: imageClipPath,
        }}
      >
        <Image
          src={imgSrc}
          alt={member.name}
          fill
          sizes="128px"
          loading="lazy"
          className="object-cover"
        />
      </div>

      {/* SVG HEX OUTLINE + HOVER OVERLAY */}
      <svg
        className="absolute w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Dark overlay */}
        <polygon
          points={HEX_POINTS_STR}
          fill="black"
          opacity={hovered ? 0.6 : 0}
          style={{ mixBlendMode: "multiply", transition: "opacity 0.3s ease" }}
        />

        {/* Outline */}
        <polygon
          points={HEX_POINTS_STR}
          fill="none"
          stroke="#F6C13D"
          strokeWidth={6}
        />
      </svg>

      {/* TEXT OVERLAY */}
      <div
        className="absolute flex flex-col items-center justify-center text-white px-2"
        style={{
          width: "100%",
          height: "100%",
          clipPath: HEX_CLIP_PATH,
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.3s ease",
          pointerEvents: "none",
        }}
      >
        <h3
          className="font-bold text-center"
          style={{ fontSize: "7px", lineHeight: 1.1, maxWidth: "85%" }}
        >
          {nameLines.map((line, i) => (
            <span key={i}>
              {line}
              {i < nameLines.length - 1 && <br />}
            </span>
          ))}
        </h3>

        <p
          className="mt-1 text-center"
          style={{ fontSize: "7px", lineHeight: 1.1, maxWidth: "85%" }}
        >
          {positionLines.map((line, i) => (
            <span key={i}>
              {line}
              {i < positionLines.length - 1 && <br />}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
