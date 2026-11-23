"use client";

import { useState } from "react";
import { ChevronDown, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import StreakCalendar from "@/components/dashboard/StreakCalendar";
import { getStreakDayKeys } from "@/lib/dashboard/dates";
import { toDayKey } from "@/lib/gamification/calendarDay";
import { streakAsOf, type StreakState } from "@/lib/gamification/streak";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { usePrefersReducedMotion } from "@/components/hooks/usePrefersReducedMotion";

interface StreakBarProps {
  streak: StreakState;
  /** The zone the streak's days are counted in. */
  timeZone: string;
  calendarDays: Record<string, number>;
  today?: Date;
}

const formatDays = (days: number) => `${days} ${days === 1 ? "Day" : "Days"}`;

export default function StreakBar({
  streak: storedStreak,
  timeZone,
  calendarDays,
  today = new Date(),
}: StreakBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const todayKey = toDayKey(today, timeZone);
  const streak = streakAsOf(storedStreak, todayKey);
  const reduceMotion = usePrefersReducedMotion();

  return (
    <section>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className={cn(
          "flex w-full items-center gap-4 border border-orange-300 bg-amber-100 px-4 py-2 text-left shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          isOpen ? "rounded-t-lg" : "rounded-lg",
        )}
      >
        {streak > 0 && !reduceMotion ? (
          <DotLottieReact
            src="/Fire.lottie"
            loop
            autoplay
            className="h-12 w-12 shrink-0"
            aria-hidden="true"
          />
        ) : (
          <Flame
            aria-hidden="true"
            className={cn(
              "h-10 w-10 shrink-0",
              streak > 0
                ? "fill-orange-500 text-orange-500"
                : "fill-gray-300 text-gray-400",
            )}
          />
        )}

        <span className="flex flex-col">
          <span className="text-3xl font-semibold">
            <span className="sr-only">Current streak: </span>
            {formatDays(streak)}
          </span>
          <span className="text-sm font-medium text-gray-700">
            Best streak: {formatDays(storedStreak.longestStreak)}
          </span>
        </span>

        <ChevronDown
          className={cn(
            "ml-auto h-6 w-6 shrink-0 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div className="rounded-b-lg border border-t-0 border-orange-300 bg-orange-50 p-4 shadow">
          <StreakCalendar
            calendarDays={calendarDays}
            streakDays={getStreakDayKeys(storedStreak.lastActiveDay, streak)}
            todayKey={todayKey}
          />
        </div>
      )}
    </section>
  );
}
