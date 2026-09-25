"use client";

import { useState } from "react";
import { getMonthGrid, toDateKey } from "@/lib/dashboard/dates";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";

interface StreakCalendarProps {
  activeDays: Set<string>;
  streakDays: Set<string>;
}


const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const navButtonClass =
  "rounded p-1 transition-colors hover:bg-orange-100 disabled:opacity-30 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export default function StreakCalendar({ activeDays, streakDays }: StreakCalendarProps) {
  const today = new Date();
  const todayKey = toDateKey(today);

  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const cells = getMonthGrid(view.year, view.month);
  const monthLabel = new Date(view.year, view.month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" },);
  const isCurrentMonth = view.year === today.getFullYear() && view.month === today.getMonth();

  const changeMonth = (offset: number) => {
    setView((prev) => {
      const d = new Date(prev.year, prev.month + offset, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between border-b border-gray-300 pb-2">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          aria-label="Previous month"
          className={navButtonClass}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <h3 className="text-xl font-semibold" aria-live="polite">
          {monthLabel}
        </h3>

        <button
          type="button"
          onClick={() => changeMonth(1)}
          disabled={isCurrentMonth}
          aria-label="Next month"
          className={navButtonClass}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-y-3 text-center">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-sm font-semibold text-gray-600">
            {day}
          </div>
        ))}

        {cells.map((date, index) => {
          if (!date) return <div key={`blank-${index}`} />;

          const key = toDateKey(date);
          const isToday = key === todayKey;
          const inStreak = streakDays.has(key);
          const isActive = inStreak || activeDays.has(key);

          const column = index % 7; 
          const prev = column > 0 ? cells[index - 1] : null;
          const next = column < 6 ? cells[index + 1] : null;
          const prevInStreak = !!prev && streakDays.has(toDateKey(prev));
          const nextInStreak = !!next && streakDays.has(toDateKey(next));

          const label = date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          });

          return (
            <div
              key={key}
              className={cn(
                "flex justify-center py-1",
                inStreak && "bg-orange-100",
                inStreak && !prevInStreak && "rounded-l-full",
                inStreak && !nextInStreak && "rounded-r-full",
              )}
            >
              <div
                title={label}
                className={cn(
                  "relative flex h-9 w-9 items-center justify-center rounded-full text-sm",
                  isActive
                    ? "bg-primary font-semibold text-gray-900"
                    : "bg-gray-200 text-gray-700",
                  isToday && "ring-2 ring-gray-500 ring-offset-2",
                  isToday && (inStreak ? "ring-offset-orange-100" : "ring-offset-orange-50"),
                )}
              >
                {inStreak && (
                  <Flame
                    aria-hidden="true"
                    className="absolute h-7 w-7 origin-bottom fill-amber-300 text-amber-300 motion-safe:animate-flicker"
                    style={{ animationDelay: `${(index % 5) * -0.23}s` }}
                  />
                )}
                <span aria-hidden="true" className="relative">
                  {date.getDate()}
                </span>
                <span className="sr-only">
                  {label}
                  {isToday && ", today"}
                  {isActive ? ", studied" : ", no activity"}
                  {inStreak && ", part of your current streak"}
                </span>
              </div>
            </div>
          );

        })}
      </div>
    </div>
  );
}

