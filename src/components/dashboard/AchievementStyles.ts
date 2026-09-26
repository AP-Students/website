export interface BadgeStyle {
  fill: string; 
  border: string; 
  icon: string; 
  premium?: boolean; 
  glow?: string; 
  sparkles?: boolean; 
}

export const BADGE_STYLES: Record<string, BadgeStyle> = {
  "reading-1": { fill: "from-amber-100 to-amber-200", border: "bg-amber-300", icon: "text-amber-700" },
  "reading-5": { fill: "from-amber-200 to-amber-400", border: "bg-amber-500", icon: "text-amber-800" },
  "reading-25": { fill: "from-yellow-300 to-amber-500", border: "bg-yellow-600", icon: "text-yellow-900" },
  "reading-50": {
    fill: "from-yellow-400 to-amber-600",
    border: "bg-gradient-to-br from-yellow-100 via-amber-500 to-yellow-800",
    icon: "text-yellow-950",
    premium: true,
  },

  "test-1": { fill: "from-sky-100 to-sky-300", border: "bg-sky-400", icon: "text-sky-800" },
  "test-10": { fill: "from-blue-400 to-blue-600", border: "bg-blue-700", icon: "text-white" },

  "frq-1": { fill: "from-violet-100 to-violet-300", border: "bg-violet-400", icon: "text-violet-800" },
  "frq-10": { fill: "from-purple-500 to-purple-700", border: "bg-purple-800", icon: "text-white" },

  "streak-3": { fill: "from-yellow-300 to-orange-400", border: "bg-orange-500", icon: "text-orange-900" },
  "streak-7": { fill: "from-orange-400 to-red-500", border: "bg-red-600", icon: "text-white" },
  "streak-30": {
    fill: "from-orange-500 to-red-600",
    border: "bg-red-700",
    icon: "text-white",
    glow: "drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]",
  },

  "level-5": { fill: "from-cyan-200 to-teal-400", border: "bg-teal-500", icon: "text-teal-900" },
  "level-10": { fill: "from-teal-500 to-teal-700", border: "bg-teal-800", icon: "text-white", sparkles: true },

  "problems-100": { fill: "from-green-300 to-green-500", border: "bg-green-600", icon: "text-green-950" },
  "subject-1": { fill: "from-emerald-400 to-yellow-300", border: "bg-emerald-700", icon: "text-emerald-950" },
};

export const DEFAULT_BADGE_STYLE: BadgeStyle = {
  fill: "from-orange-200 to-orange-400",
  border: "bg-orange-500",
  icon: "text-orange-900",
};
