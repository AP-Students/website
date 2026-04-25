"use client";

import { useMemo } from "react";
import TeamMemberHex from "./TeamMemberHex";
import type { TeamMember } from "@/types/team";

const HIVE_SCALE = 0.58;
const HEX_SIZE = 240 * HIVE_SCALE;

const lance: TeamMember = {
  id: 20,
  name: "Lance Xu",
  position: "Founder/CEO",
  image: "/team/lance.jpg",
};

const teamLeads: TeamMember[] = [
  {
    id: 13,
    name: "Reading",
    position: "FiveHive Lead",
    image: "/team/Google_pfp - Wenbo W.png",
  },
  // {
  //   id: 21,
  //   name: "Janya",
  //   position: "Data Analysis Sub-Team Lead, Outreach Team Lead",
  //   image: "/team/IMG_6216 - Janya Jain.jpeg",
  // },
  {
    id: 22,
    name: "Shreya Suresh",
    position: "Outreach Team Lead",
    image: "/team/Shreya Suresh.png",
  },
  {
    id: 23,
    name: "Ethan Chen",
    position: "Outreach Team Lead",
    image: "/team/af88d83f60d8f856f74b2d83ec9c799d - Ethan.jpg",
  },
  {
    id: 24,
    name: "Scipio H",
    position: "Survey & FAQ Team Lead",
    image: "/team/Screenshot 2025-07-23 011653 - Scipio H.png",
  },
  {
    id: 4,
    name: "Ashay Sarda",
    position: "Website Team Colead",
    image: "/team/4526954c591bc1f55f65cfb8499decf7 - Ashay Sarda - Turtle Walkers.png",
  },
  {
    id: 7,
    name: "River Antonov",
    position: "Science Co-lead, bio crew, material & lecture",
    image: "/team/frtshit - River Antonov",
  },
  {
    id: 12,
    name: "Anmol Nanjundareddy",
    position: "Math/CS Colead, Lecture/Materials Member, FAQ Subteam",
    image: "/team/bumblebee pfp - Anmol Nanjundareddy.png",
  },
  {
    id: 15,
    name: "Ali A.",
    position: "Science Co-Lead",
    image: "/team/─ .✦ With Filter & Stickers  - Jasmine Gadot.jpeg",
  },
];

const subTeamLeads: TeamMember[] = [
  {
    id: 25,
    name: "Liuren",
    position: "Team Co-Lead, RST Team Lead",
    image: "/team/IMG_3498 - Pierre-Louis Nguyen.jpg",
  },
  {
    id: 27,
    name: "A Ashraf",
    position: "Data Analysis Sub-Team Lead, APSS Admin",
    image: "/team/ChatGPT Image Sep 13, 2025, 09_54_35 PM - Ahmed Ashraf.png",
  },
  {
    id: 28,
    name: "mmbcsmen",
    position: "RST Co-Lead",
    image: "/team/mmbcsmen pfp - Father Brandon.jpg",
  },
  {
    id: 29,
    name: "Matthew Belyea",
    position: "Materials, Lecture Sub-Team Lead",
    image: "/team/IMG_0145 - Matthew Belyea.jpeg",
  },
  // Inactive
  // {
  //   id: 30,
  //   name: "Sean",
  //   position: "Materials, Lecture Sub-Team Lead",
  //   image: "/team/sheep-4810513_1280 - Sean Nguyen.jpg",
  // },
  {
    id: 31,
    name: "thecoolsavage",
    position: "Materials Sub-Team Co-Lead",
    image: "/team/raw - Rayan Zaman.png",
  },
  {
    id: 32,
    name: "Henry",
    position: "RST Co-Lead, Lecture Sub-Team Lead",
    image: "/team/dukechapel - Henry H.jpg",
  },
];

const members: TeamMember[] = [
  {
    id: 1,
    name: "Sprite",
    position: "Lecture Sub-Team Member",
    image: "/team/star-wars-visions-1-tall_6acc99ff - Spryzen.jpeg",
  },
  {
    id: 2,
    name: "Nikolas",
    position: "Materials Sub-Team Member",
    image: "/team/c95747eb1048ca82305685580ae28cf8 - Nikolas Dyer.webp",
  },
  {
    id: 3,
    name: "ioc025",
    position: "Materials Sub-Team Member",
    image: "/team/profilepic - Benjamin Park.png",
  },
  {
    id: 5,
    name: "Insomnia",
    position: "Lecture Sub-Team Member",
    image: "/team/IMG_9848 - Professional Procrastinator.jpeg",
  },
  {
    id: 6,
    name: "Cylix",
    position: "Review Session Sub-Team Member",
    image: "/team/IMG_0010 - Cylix.jpeg",
  },
  {
    id: 8,
    name: "Aryan Ojha",
    position: "FAQ Doc Sub-Team Member",
    image: "/team/Stark  _ Frieren_ Beyond Journey's End - Aryan Ojha.jpeg",
  },
  {
    id: 9,
    name: "hub34.",
    position: "Materials Sub-Team Member",
    image: "/team/c1117760e5fafa1f92771b2ed99147e9 - Hub35.png",
  },
  {
    id: 10,
    name: "Adhitya Sriram",
    position: "Lecture Sub-Team Member",
    image: "/team/IMG-20260404-WA0000 - Adhitya Sriram.jpg",
  },
  {
    id: 11,
    name: "Notanimpostor2",
    position: "Lecture Sub-Team Member",
    image: "/team/OIP - Reid Alexander.jpg",
  },
  {
    id: 14,
    name: "Roenan Soriano",
    position: "Lecture Sub-Team Member",
    image: "/team/20221201_215150_Original - Richard.jpeg",
  },
  {
    id: 16,
    name: "catsby523",
    position: "Lecture Sub-Team Member",
    image: "/team/IMG_5897 - Ree Vool.jpeg",
  },
  {
    id: 17,
    name: "Abomination",
    position: "Review Session Sub-Team Member",
    image: "/team/OIP - Reid Alexander.jpg",
  },
  {
    id: 18,
    name: "Ansh Desai",
    position: "FAQ Doc Sub-Team Member",
    image: "/team/Photo for FiveHive - Ansh Desai.jpg",
  },
  {
    id: 19,
    name: "Ansh Desai",
    position: "Materials Sub-Team Member",
    image: "/team/Photo for FiveHive - Ansh Desai.jpg",
  },
  { id: 33, name: "Zoe Xue", position: "Materials Sub-Team Member", image: "/team/ZoeProfile - zox.jpg" },
  { id: 34, name: "Silas Lovett", position: "Website Sub-Team Member", image: "/team/pfp - Silas Lovett.png" },
  { id: 35, name: "Hector Wang", position: "Lecture Sub-Team Member, Materials Sub-Team Member", image: "/team/unnamed - Hector.png" },
  { id: 36, name: "anisul", position: "Outreach Sub-Team Member (Dishonorably Relieved)", image: "/team/14d5dbfc447d088546351ce57855adeb - anisul.jpg" },
  { id: 37, name: "mqax", position: "Survey Sub-Team Member, Data Analysis Sub-Team Member", image: "/team/mqaxPFP - Max.jpg" },
  { id: 38, name: "Econ Guy", position: "Lecture Sub-Team Member", image: "/team/ucsdpride - Israel Cube.jpg" },
  { id: 39, name: "pineappled juice", position: "Lecture Sub-Team Member", image: "/team/IMG_2546 - Mina.jpeg" },
  { id: 40, name: "assassin3552", position: "Materials Sub-Team Member (Temporarily Dormant)", image: "/team/48 - Polaris Li.jpg" },
  { id: 41, name: "Tanay B", position: "Lecture Sub-Team Member, Materials Sub-Team Member", image: "/team/IMG_0810 - Tanay Bollam.jpeg" },
  { id: 42, name: "blitzal", position: "Materials Sub-Team Member (Dishonorably Relieved)", image: "/team/blitzalpfp - Kate Damico.jpg" },
  { id: 43, name: "Sripaadh Jayashree Kuppusamy", position: "FAQ Doc Sub-Team Member, Lecture Sub-Team Member, Materials Sub-Team Member", image: "/team/52e94b8f-71c0-40c6-87b3-51299c73b852 - Sripaadh Jayashree Kuppusamy.JPG" },
  { id: 44, name: "suri", position: "Survey Sub-Team Member", image: "/team/IMG_3641 - Suri Sanchez.jpeg" },
  { id: 45, name: "Jacob", position: "Materials Sub-Team Member", image: "/team/J - Hystix.jpg" },
  { id: 46, name: "Jasmine Gadot", position: "Lecture Sub-Team Member, Materials Sub-Team Member", image: "/team/IMG_2093 - Jasmine Gadot.jpeg" },
  { id: 47, name: "Elvis Peng", position: "Materials Sub-Team Member", image: "/team/OMEGA - Elvis Peng(1).png" },
  { id: 48, name: "Jackson D.", position: "Lecture Sub-Team Member", image: "/team/IMG_3156 - Jackson D..webp" },
  { id: 49, name: "braden_is", position: "Lecture Sub-Team Member", image: "/team/IMG_2502 - Sigma Make.jpeg" },
  { id: 50, name: "Ian Joo", position: "Data Analysis Sub-Team Member, Outreach Sub-Team Member", image: "/team/IMG-20250901-WA0013 - Ian Joo.jpg" },
  { id: 51, name: "user_exists", position: "Materials Sub-Team Member", image: "/team/c95747eb1048ca82305685580ae28cf8 - Nikolas Dyer.png" },
  { id: 52, name: "Akshaj D", position: "Data Analysis Sub-Team Member", image: "/team/Profile Picture - Akshaj Donthi.jpg" },
  { id: 53, name: "irunwithscizors", position: "Lecture Sub-Team Member", image: "/team/acnh-tuna-header - Logan Li.jpg" },
  { id: 54, name: "dkim19375", position: "Survey Sub-Team Member, Data Analysis Sub-Team Member", image: "/team/scratch - dkim (dkim19375).png" },
  { id: 55, name: "Sarah H.", position: "Survey Sub-Team Member, Data Analysis Sub-Team Member, FAQ Doc Sub-Team Member", image: "/team/default_pfp - Sarah H..jpg" },
  { id: 56, name: "SWalexcorporation", position: "Lecture Sub-Team Member, Materials Sub-Team Member", image: "/team/IMG_1432 - Alex Saravia.jpeg" },
  { id: 57, name: "Orin Overmiller", position: "Materials Sub-Team Member", image: "/team/00f9d6ee40f00182bd69d557320d63a2 - orin overmiller.png" },
  { id: 58, name: "MG8mer", position: "Lecture Sub-Team Member", image: "/team/MG8mer.png" },
];

const teamMembers = [lance, ...teamLeads, ...subTeamLeads, ...members];

// --- Helpers: hex grid generation (axial coords) ---
function hexRange(radius: number) {
  const results: { q: number; r: number }[] = [];
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) {
      results.push({ q, r });
    }
  }
  return results;
}

function axialDistance(a: { q: number; r: number }) {
  const x = a.q;
  const z = a.r;
  const y = -x - z;
  return Math.max(Math.abs(x), Math.abs(y), Math.abs(z));
}

function toPixel(q: number, r: number, size: number, originX: number, originY: number) {
  const x = size * Math.sqrt(3) * (q + r / 2) + originX;
  const y = size * (3 / 2) * r + originY;
  return { x, y };
}

export default function TeamHive() {
  const hexSize = HEX_SIZE;
  const hexRadius = hexSize * 0.4;

  const radius = useMemo(() => {
    let r = 0;
    while (1 + 3 * r * (r + 1) < teamMembers.length) {
      r += 1;
    }
    return r;
  }, []);

  const cells = useMemo(() => {
    return hexRange(radius)
      .map((hex) => ({ ...hex, dist: axialDistance(hex) }))
      .sort((a, b) => a.dist - b.dist || a.r - b.r || a.q - b.q)
      .slice(0, teamMembers.length);
  }, [radius]);

  const centerX = 0;
  const centerY = 0;

  const placements = useMemo(() => {
    return cells
      .map((hex, index) => {
        const member = teamMembers[index];
        if (!member) return null;

        const { q, r } = hex;
        const px = toPixel(q, r, hexRadius, centerX, centerY);
        return {
          key: `${q},${r}`,
          member,
          left: px.x - hexSize / 2,
          top: px.y - hexSize / 2,
        };
      })
      .filter((placement) => placement !== null);
  }, [cells, hexRadius, hexSize]);

  const paddedBounds = useMemo(() => {
    if (placements.length === 0) {
      return { minLeft: 0, minTop: 0, width: 980, height: 400 };
    }

    const padding = hexSize * 0.7;
    let minLeft = Infinity;
    let maxRight = -Infinity;
    let minTop = Infinity;
    let maxBottom = -Infinity;

    for (const placement of placements) {
      minLeft = Math.min(minLeft, placement.left);
      minTop = Math.min(minTop, placement.top);
      maxRight = Math.max(maxRight, placement.left + hexSize);
      maxBottom = Math.max(maxBottom, placement.top + hexSize);
    }

    return {
      minLeft,
      minTop,
      width: Math.ceil(maxRight - minLeft + padding * 2),
      height: Math.ceil(maxBottom - minTop + padding * 2),
      padding,
    };
  }, [placements, hexSize]);

  return (
    <div className="relative mx-auto w-full max-w-[1280px] overflow-x-hidden pb-4">
      <div
        className="relative mx-auto"
        style={{
          width: `${Math.max(paddedBounds.width, 980)}px`,
          height: `${paddedBounds.height}px`,
        }}
      >
        {placements.map((placement) => {
          return (
            <div
              key={placement.key}
              style={{
                position: "absolute",
                left: placement.left - paddedBounds.minLeft + (paddedBounds.padding ?? 0),
                top: placement.top - paddedBounds.minTop + (paddedBounds.padding ?? 0),
                width: hexSize,
                height: hexSize,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                filter: "drop-shadow(0 10px 22px rgba(0,0,0,0.18))",
              }}
            >
              <TeamMemberHex member={placement.member} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
