"use client";

import TeamMemberHex from "./TeamMemberHex";
import { TeamMember } from "@/types/team";

const teamMembers: TeamMember[] = [
  { id: 1, name: "John Doe",    position: "CEO",              image: "/team/default-profile.png", bio: "" },
  { id: 2, name: "Jane Smith",  position: "CTO",             image: "/team/default-profile.png", bio: "" },
  { id: 3, name: "Mike Johnson",position: "Lead Dev",        image: "/team/default-profile.png", bio: "" },
  { id: 4, name: "Sarah Wilson",position: "UX Designer",     image: "/team/default-profile.png", bio: "" },
  { id: 5, name: "Alex Brown",  position: "Content Manager", image: "/team/default-profile.png", bio: "" },
  { id: 6, name: "Emily Davis", position: "Marketing Lead",  image: "/team/default-profile.png", bio: "" },
  { id: 7, name: "Chris Taylor",position: "Backend Dev",     image: "/team/default-profile.png", bio: "" },
];

export default function TeamHive() {
  return (
    <div className="flex justify-center items-center min-h-[700px]">
      <div className="relative w-[640px]">
        <div className="relative ml-[82px] mb-[-40px]">
          {teamMembers.slice(0, 3).map((m) => (
            <TeamMemberHex key={m.id} member={m} />
          ))}
        </div>
        <div className="relative mb-[-40px]">
          {teamMembers.slice(3, 7).map((m) => (
            <TeamMemberHex key={m.id} member={m} />
          ))}
        </div>
        <div className="relative ml-[82px]">
          {[8,9,10].map((i, idx) => {
            const base = teamMembers[idx];
            return (
              <TeamMemberHex
                key={i}
                member={{
                  ...base,
                  id: i,
                  name: `Placeholder ${i}`,
                  position: ["QA Engineer","Prod Manager","DevOps"][idx],
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
