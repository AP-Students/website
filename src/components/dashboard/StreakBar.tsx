"use client";

import { useState } from "react";
import { ChevronDown, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import StreakCalendar from "@/components/dashboard/StreakCalendar";
import { getStreakDayKeys, getDisplayStreak } from "@/lib/dashboard/dates";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { usePrefersReducedMotion } from "@/components/hooks/usePrefersReducedMotion";

interface StreakBarProps {
  currentStreak: number;
  lastActiveDay: string | null;
  calendarDays: Record<string, number>;
  today?: Date;
}

export default function StreakBar({ currentStreak, lastActiveDay, calendarDays, today = new Date() }: StreakBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const streak = getDisplayStreak(currentStreak, lastActiveDay, today);
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
        )
        
      }
      >
        {streak > 0 && !reduceMotion ? (
          <DotLottieReact src="/Fire.lottie" loop autoplay className="h-12 w-12 shrink-0" aria-hidden="true"/>) : (
          <Flame
            aria-hidden="true"
            className={cn(
              "h-10 w-10 shrink-0",
              streak > 0 ? "fill-orange-500 text-orange-500" : "fill-gray-300 text-gray-400",
            )}
          />
        )}


        <span className="translate-y-1.5 text-3xl font-semibold">
          <span className="sr-only">Current streak: </span>
          {streak} {streak === 1 ? "Day" : "Days"}
        </span>


        <ChevronDown
          className={cn(
            "ml-auto h-6 w-6 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div className="rounded-b-lg border border-t-0 border-orange-300 bg-orange-50 p-4 shadow">
          <StreakCalendar
            calendarDays={calendarDays}
            streakDays={getStreakDayKeys(lastActiveDay, streak)}
            today={today}
          />
        </div>
      )}
    </section>
  );
}
