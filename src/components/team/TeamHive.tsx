"use client";

import { useState } from "react";
import TeamMemberHex from "./TeamMemberHex";
import { TeamMember } from "@/types/team";

// Sample team data - can be easily updated with real information
const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: "John Doe",
    position: "Co-Founder & CEO",
    image: "/team/placeholder-1.jpg",
    bio: "Passionate about education technology and helping students succeed."
  },
  {
    id: 2,
    name: "Jane Smith",
    position: "Co-Founder & CTO",
    image: "/team/placeholder-2.jpg",
    bio: "Full-stack developer with a love for creating intuitive user experiences."
  },
  {
    id: 3,
    name: "Mike Johnson",
    position: "Lead Developer",
    image: "/team/placeholder-3.jpg",
    bio: "Frontend specialist focused on performance and accessibility."
  },
  {
    id: 4,
    name: "Sarah Wilson",
    position: "UX Designer",
    image: "/team/placeholder-4.jpg",
    bio: "Design enthusiast creating beautiful and functional interfaces."
  },
  {
    id: 5,
    name: "Alex Brown",
    position: "Content Manager",
    image: "/team/placeholder-5.jpg",
    bio: "AP curriculum expert ensuring quality educational content."
  },
  {
    id: 6,
    name: "Emily Davis",
    position: "Marketing Lead",
    image: "/team/placeholder-6.jpg",
    bio: "Spreading the word about FiveHive to help more students."
  },
  {
    id: 7,
    name: "Chris Taylor",
    position: "Backend Developer",
    image: "/team/placeholder-7.jpg",
    bio: "Infrastructure expert keeping everything running smoothly."
  }
];

export default function TeamHive() {
  return (
    <div className="flex justify-center items-center min-h-[600px]">
      {/* Center container with fixed width like the CSS example */}
      <div className="relative w-[612px]">
        {/* Row 1: 3 hexagons - odd row (offset) */}
        <div className="relative ml-[76.5px] mb-[-38px]">
          <TeamMemberHex member={teamMembers[0]} className="inline-block" />
          <TeamMemberHex member={teamMembers[1]} className="inline-block" />
          <TeamMemberHex member={teamMembers[2]} className="inline-block" />
        </div>
        
        {/* Row 2: 4 hexagons - even row (no offset) */}
        <div className="relative mb-[-38px]">
          <TeamMemberHex member={teamMembers[3]} className="inline-block" />
          <TeamMemberHex member={teamMembers[4]} className="inline-block" />
          <TeamMemberHex member={teamMembers[5]} className="inline-block" />
          <TeamMemberHex member={teamMembers[6]} className="inline-block" />
        </div>
        
        {/* Row 3: 3 hexagons - odd row (offset) */}
        <div className="relative ml-[76.5px]">
          <TeamMemberHex 
            member={{
              ...teamMembers[0],
              name: "David Lee",
              position: "QA Engineer",
              id: 8
            }} 
            className="inline-block" 
          />
          <TeamMemberHex 
            member={{
              ...teamMembers[1],
              name: "Lisa Chen",
              position: "Product Manager",
              id: 9
            }} 
            className="inline-block" 
          />
          <TeamMemberHex 
            member={{
              ...teamMembers[2],
              name: "Ryan Kim",
              position: "DevOps Engineer",
              id: 10
            }} 
            className="inline-block" 
          />
        </div>
      </div>
    </div>
  );
}