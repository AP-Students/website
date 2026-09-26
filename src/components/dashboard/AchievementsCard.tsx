"use client";

import { useState, type CSSProperties } from "react";
import { BookOpen, ClipboardCheck, Flame, PenLine, Lock, Sparkles, Target, Trophy, Star, type LucideIcon } from "lucide-react";
import { ACHIEVEMENTS, type AchievementDefinition, type AchievementIcon, type AchievementStats} from "@/lib/achievements/definitions";
import { cn } from "@/lib/utils";
import { BADGE_STYLES, DEFAULT_BADGE_STYLE } from "@/components/dashboard/AchievementStyles";


const ICONS: Record<AchievementIcon, LucideIcon> = {
  book: BookOpen,
  test: ClipboardCheck,
  frq: PenLine,
  flame: Flame,
  star: Star,
  target: Target,
  trophy: Trophy,
};

const HEXAGON: CSSProperties = {
  clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
};

const COLLAPSED_COUNT = 6;

interface AchievementsCardProps {
  stats: AchievementStats;
  earnedIds: ReadonlySet<string>;
}

export default function AchievementsCard({ stats, earnedIds }: AchievementsCardProps) {
  const [showAll, setShowAll] = useState(false);

  const progressOf = (achievement: AchievementDefinition) =>
    Math.min(stats[achievement.stat], achievement.threshold) / achievement.threshold;

  const sorted = [...ACHIEVEMENTS].sort((a, b) => {
    const aEarned = earnedIds.has(a.id);
    const bEarned = earnedIds.has(b.id);
    if (aEarned !== bEarned) return aEarned ? -1 : 1;
    return progressOf(b) - progressOf(a);
  });
  const visible = showAll ? sorted : sorted.slice(0, COLLAPSED_COUNT);

  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-2xl font-bold">Achievements:</h2>
        <span className="text-sm text-gray-600">
          {earnedIds.size} / {ACHIEVEMENTS.length} earned
        </span>
      </div>

      <ul className="grid grid-cols-2 gap-x-2 gap-y-6 sm:grid-cols-3">
        {visible.map((achievement) => {
          const Icon = ICONS[achievement.icon];
          const earned = earnedIds.has(achievement.id);
          const style = BADGE_STYLES[achievement.id] ?? DEFAULT_BADGE_STYLE;
          const current = Math.min(stats[achievement.stat], achievement.threshold);

          return (
            <li key={achievement.id} className="flex flex-col items-center text-center">
              <div
                aria-hidden="true"
                className={cn(
                  "relative drop-shadow-md motion-safe:transition-transform motion-safe:hover:-translate-y-1",
                  earned && style.glow,
                )}
              >
                <div
                  style={HEXAGON}
                  className={cn(
                    "flex h-[90px] w-[104px] items-center justify-center",
                    earned ? style.border : "bg-gray-300",
                  )}
                >
                  <div
                    style={HEXAGON}
                    className={cn(
                      "flex items-center justify-center bg-gradient-to-br",
                      earned ? style.fill : "from-gray-100 to-gray-200",
                      earned && style.premium ? "h-[80px] w-[92px]" : "h-[84px] w-[97px]",
                    )}
                  >
                    <Icon className={cn("h-9 w-9", earned ? style.icon : "text-gray-400")} />
                  </div>
                </div>

                {earned && style.sparkles && (
                  <Sparkles className="absolute -right-1 -top-1 h-6 w-6 fill-yellow-200 text-yellow-400" />
                )}
                {!earned && (
                  <span className="absolute bottom-0 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow">
                    <Lock className="h-3.5 w-3.5 text-gray-500" />
                  </span>
                )}
              </div>

              <p className="mt-2 text-xs font-semibold">{achievement.title}</p>
              <p className="text-[11px] leading-tight text-gray-500">{achievement.description}</p>
              <span className="sr-only">{earned ? "Earned" : "Locked"}</span>

              {!earned && (
                <div className="mt-1.5 w-20">
                  <div
                    role="progressbar"
                    aria-label={`${achievement.title} progress`}
                    aria-valuemin={0}
                    aria-valuemax={achievement.threshold}
                    aria-valuenow={current}
                    className="h-1 w-full rounded-full bg-gray-200"
                  >
                    <div
                      className="h-full rounded-full bg-gray-500"
                      style={{ width: `${(current / achievement.threshold) * 100}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-[10px] text-gray-500">
                    {current} / {achievement.threshold}
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {sorted.length > COLLAPSED_COUNT && (
        <button
          type="button"
          onClick={() => setShowAll((prev) => !prev)}
          aria-expanded={showAll}
          className="mt-4 text-sm font-semibold text-orange-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {showAll ? "Show less" : `Show all (${sorted.length})`}
        </button>
      )}
    </section>
  );
}
