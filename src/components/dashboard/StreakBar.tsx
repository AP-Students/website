"use client";

import { useState } from "react";
import { ChevronDown, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import StreakCalendar from "@/components/dashboard/StreakCalendar";
import { getStreakDayKeys, getDisplayStreak } from "@/lib/dashboard/dates";

interface StreakBarProps {
  currentStreak: number;
  lastActiveDay: string | null;
  calendarDays: Record<string, number>;
  today?: Date;
}

export default function StreakBar({ currentStreak, lastActiveDay, calendarDays, today = new Date() }: StreakBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const streak = getDisplayStreak(currentStreak, lastActiveDay, today);
  const activeDays = new Set<string>();
  for (const [day, count] of Object.entries(calendarDays)) {
    if (count > 0) {
      activeDays.add(day);
    }
  }

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
        {/* Placeholder: replaced by the animated Lottie fire in step 4b */}
        <Flame className="h-10 w-10 fill-orange-500 text-orange-500" />

        <span className="text-3xl font-semibold">
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
            activeDays={new Set(activeDays)}
            streakDays={getStreakDayKeys(lastActiveDay, streak)}
            today={today}
          />
        </div>
      )}
    </section>
  );
}
