"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { cn } from "@/lib/utils";
import {
  addDays,
  daysBetween,
  formatDayKey,
  isDayKey,
  toDayKey,
  type DayKey,
} from "@/lib/gamification/calendarDay";
import {
  buildYearCalendar,
  dayLabel,
  daySummary,
  describeActivity,
  type IntensityLevel,
} from "@/lib/gamification/activityCalendar";

interface ActivityCalendarProps {
  /** Completions per day, e.g. "2026-09-20" -> 3, for this year and last. */
  calendarDays: Record<string, number>;
  /** The zone the student's days are counted in. */
  timeZone: string;
  today?: Date;
}

// Tailwind's yellow 200, 400, 600 and 800 after an empty gray. Yellow 200 is
// nearly white (1.16:1 against it), so it gets a border to show up.
const LEVEL_CLASSES: Record<IntensityLevel, string> = {
  0: "bg-gray-200",
  1: "border border-yellow-500 bg-yellow-200",
  2: "bg-yellow-400",
  3: "bg-yellow-600",
  4: "bg-yellow-800",
};
const LEVELS = [0, 1, 2, 3, 4] as const;

// Rows run Sunday to Saturday. Like GitHub, only every other row is labeled.
const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Arrow keys move a day up or down a column, or a week across a row.
const ARROW_STEPS: Partial<Record<string, number>> = {
  ArrowUp: -1,
  ArrowDown: 1,
  ArrowLeft: -7,
  ArrowRight: 7,
};

const cellIn = (table: HTMLTableElement | null, day: DayKey | null) =>
  day ? table?.querySelector<HTMLElement>(`[data-day="${day}"]`) : null;

const dayFrom = (target: EventTarget | null): DayKey | undefined =>
  target instanceof Element
    ? target.closest<HTMLElement>("[data-day]")?.dataset.day
    : undefined;

/**
 * A GitHub-style calendar of a whole year of study activity, one square per
 * day, darker for busier days. Hovering, focusing or tapping a day shows how
 * much was done on it.
 */
export default function ActivityCalendar({
  calendarDays,
  timeZone,
  today = new Date(),
}: ActivityCalendarProps) {
  const todayKey = toDayKey(today, timeZone);
  const thisYear = Number(todayKey.slice(0, 4));

  const counts = useMemo(
    () =>
      new Map(
        Object.entries(calendarDays).filter(
          ([day, count]) =>
            isDayKey(day) && Number.isInteger(count) && count > 0,
        ),
      ),
    [calendarDays],
  );
  const hasLastYear = [...counts.keys()].some((day) =>
    day.startsWith(`${thisYear - 1}-`),
  );

  // Remembered as "last year" rather than a number, so it stays right when
  // the dashboard is left open over New Year.
  const [showLastYear, setShowLastYear] = useState(false);
  const year = showLastYear && hasLastYear ? thisYear - 1 : thisYear;
  const calendar = useMemo(
    () => buildYearCalendar(counts, year, { today: todayKey }),
    [counts, year, todayKey],
  );
  const labels = useMemo(
    () =>
      new Map(
        calendar.weeks
          .flat()
          .flatMap((cell) =>
            cell && !cell.isFuture
              ? [[cell.day, dayLabel(cell.day, cell.count)]]
              : [],
          ),
      ),
    [calendar],
  );

  // The grid is one tab stop; arrow keys move between days (WAI-ARIA grid).
  const [focusDay, setFocusDay] = useState<DayKey | null>(null);
  const [focusInside, setFocusInside] = useState(false);
  const [hoverDay, setHoverDay] = useState<DayKey | null>(null);
  const tabStop =
    focusDay && labels.has(focusDay) ? focusDay : calendar.lastDay;
  const activeDay = hoverDay ?? (focusInside ? tabStop : null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const instructionsId = useId();

  // The tooltip sits outside the scrolling grid so it isn't clipped, and is
  // positioned over whichever day is active.
  const placeTooltip = useCallback(() => {
    const tooltip = tooltipRef.current;
    const wrapper = wrapperRef.current;
    const scroller = scrollRef.current;
    const cell = cellIn(tableRef.current, activeDay);
    if (!tooltip || !wrapper || !scroller || !cell) return;

    const box = wrapper.getBoundingClientRect();
    const view = scroller.getBoundingClientRect();
    const rect = cell.getBoundingClientRect();
    const half = tooltip.offsetWidth / 2;
    const center = rect.left - box.left + rect.width / 2;
    tooltip.style.left = `${Math.min(Math.max(center, half), box.width - half)}px`;
    tooltip.style.top = `${rect.top - box.top - 6}px`;
    // Hide it while its day is scrolled out of sight.
    tooltip.style.visibility =
      rect.right < view.left || rect.left > view.right ? "hidden" : "visible";
  }, [activeDay]);
  useLayoutEffect(placeTooltip, [placeTooltip]);

  // On a narrow screen the grid scrolls; start with the latest day in view.
  useEffect(() => {
    const scroller = scrollRef.current;
    const cell = cellIn(tableRef.current, calendar.lastDay);
    if (!scroller || !cell) return;
    const offset =
      cell.getBoundingClientRect().left -
      scroller.getBoundingClientRect().left +
      scroller.scrollLeft;
    scroller.scrollLeft = offset - scroller.clientWidth / 2;
  }, [calendar.lastDay]);

  const onKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    const day = dayFrom(event.target);
    if (!day || !calendar.lastDay) return;
    const step = ARROW_STEPS[event.key];
    const next =
      step !== undefined
        ? addDays(day, step)
        : event.key === "Home"
          ? calendar.firstDay
          : event.key === "End"
            ? calendar.lastDay
            : null;
    if (!next) return;
    event.preventDefault();
    if (
      daysBetween(calendar.firstDay, next) < 0 ||
      daysBetween(next, calendar.lastDay) < 0
    ) {
      return;
    }
    setFocusDay(next);
    setHoverDay(null);
    cellIn(tableRef.current, next)?.focus();
  };

  const onFocus = (event: FocusEvent<HTMLTableElement>) => {
    const day = dayFrom(event.target);
    if (!day) return;
    setFocusDay(day);
    setFocusInside(true);
  };

  const onBlur = (event: FocusEvent<HTMLTableElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setFocusInside(false);
    }
  };

  const onPointerOver = (event: PointerEvent<HTMLTableSectionElement>) =>
    setHoverDay(dayFrom(event.target) ?? null);

  const selectYear = (next: number) => {
    setShowLastYear(next !== thisYear);
    setFocusDay(null);
    setHoverDay(null);
  };

  const heading =
    calendar.total > 0
      ? `${describeActivity(calendar.total)} in ${year}`
      : `No activity in ${year}${year === thisYear ? " yet" : ""}`;

  return (
    <section aria-labelledby={headingId}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id={headingId} className="text-2xl font-bold">
          {heading}
        </h2>
        {hasLastYear && (
          <div role="group" aria-label="Year" className="flex gap-1">
            {[thisYear, thisYear - 1].map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={option === year}
                onClick={() => selectYear(option)}
                className={cn(
                  "rounded-md px-3 py-1 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  option === year
                    ? "bg-yellow-400 text-gray-900"
                    : "text-gray-600 hover:bg-yellow-100",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-300 bg-white p-4 shadow-sm">
        <div ref={wrapperRef} className="relative">
          <div
            ref={scrollRef}
            onScroll={placeTooltip}
            className="relative overflow-x-auto"
          >
            <p id={instructionsId} className="sr-only">
              Use the arrow keys to move between days.
            </p>
            <table
              ref={tableRef}
              role="grid"
              aria-readonly="true"
              aria-label={`Study activity in ${year}`}
              aria-describedby={instructionsId}
              onKeyDown={onKeyDown}
              onFocus={onFocus}
              onBlur={onBlur}
              className="w-max border-separate border-spacing-[3px]"
            >
              <thead>
                <tr>
                  <td>
                    <span className="sr-only">Day of the week</span>
                  </td>
                  {calendar.months.map((span) => {
                    const first = `${year}-${String(span.month + 1).padStart(2, "0")}-01`;
                    return (
                      <th
                        key={span.month}
                        scope="colgroup"
                        colSpan={span.weeks}
                        className="pb-1 text-left text-xs font-normal text-gray-600"
                      >
                        <span className="sr-only">
                          {formatDayKey(first, { month: "long" })}
                        </span>
                        <span aria-hidden="true">
                          {formatDayKey(first, { month: "short" })}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody
                onPointerOver={onPointerOver}
                onPointerLeave={() => setHoverDay(null)}
              >
                {WEEKDAYS.map((weekday, row) => (
                  <tr key={weekday}>
                    <th
                      scope="row"
                      className="pr-1 text-left text-[10px] font-normal leading-none text-gray-600"
                    >
                      <span className="sr-only">{weekday}</span>
                      <span aria-hidden="true">
                        {row % 2 === 1 ? weekday.slice(0, 3) : ""}
                      </span>
                    </th>
                    {calendar.weeks.map((week, column) => {
                      const cell = week[row];
                      if (!cell) {
                        return <td key={column} aria-hidden="true" />;
                      }
                      if (cell.isFuture) {
                        return (
                          <td
                            key={column}
                            aria-hidden="true"
                            className="h-[11px] w-[11px] rounded-[2px] border border-gray-200 p-0"
                          />
                        );
                      }
                      const isToday = cell.day === todayKey;
                      return (
                        <td
                          key={column}
                          role="gridcell"
                          data-day={cell.day}
                          tabIndex={cell.day === tabStop ? 0 : -1}
                          aria-label={`${labels.get(cell.day)}${isToday ? ", today" : ""}`}
                          className={cn(
                            "h-[11px] w-[11px] cursor-default rounded-[2px] p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                            LEVEL_CLASSES[cell.level],
                            cell.day === activeDay &&
                              "outline outline-1 outline-offset-1 outline-gray-900",
                          )}
                        />
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {activeDay && (
            <div
              ref={tooltipRef}
              aria-hidden="true"
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white shadow"
            >
              {daySummary(activeDay, counts.get(activeDay) ?? 0)}
            </div>
          )}
        </div>

        <div
          aria-hidden="true"
          className="mt-2 flex items-center justify-end gap-[3px] text-xs text-gray-600"
        >
          <span className="mr-1">Less</span>
          {LEVELS.map((level) => (
            <span
              key={level}
              className={cn(
                "h-[11px] w-[11px] rounded-[2px]",
                LEVEL_CLASSES[level],
              )}
            />
          ))}
          <span className="ml-1">More</span>
        </div>
      </div>
    </section>
  );
}
