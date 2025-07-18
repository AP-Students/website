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
      <div className="relative w-fit">
        {/* First row - 3 hexagons */}
        <div className="flex justify-center mb-[-2.375rem] relative ml-[4.8rem]">
          {teamMembers.slice(0, 3).map((member, index) => (
            <TeamMemberHex
              key={member.id}
              member={member}
              className="mr-1"
            />
          ))}
        </div>
        
        {/* Second row - 4 hexagons */}
        <div className="flex justify-center mb-[-2.375rem] relative">
          {teamMembers.slice(3, 7).map((member, index) => (
            <TeamMemberHex
              key={member.id}
              member={member}
              className="mr-1"
            />
          ))}
        </div>
        
        {/* Third row - 3 hexagons */}
        <div className="flex justify-center relative ml-[4.8rem]">
          {teamMembers.slice(0, 3).map((member, index) => (
            <TeamMemberHex
              key={`bottom-${member.id}`}
              member={{
                ...member,
                name: `Team Member ${index + 8}`,
                position: "Position",
                id: member.id + 10
              }}
              className="mr-1"
            />
          ))}
        </div>
      </div>
    </div>
  );
}