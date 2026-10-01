"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export const DASHBOARD_TABS = [
  { id: "overview", label: "Overview" },
  { id: "history", label: "History" },
  { id: "calendar", label: "Calendar" },
  { id: "saved", label: "Saved" },
  { id: "in-progress", label: "In Progress" },
  { id: "achievements", label: "Achievements" },
  { id: "profile", label: "Profile" },
] as const;

export type DashboardTabId = (typeof DASHBOARD_TABS)[number]["id"];

const isTabId = (value: string): value is DashboardTabId =>
  DASHBOARD_TABS.some((tab) => tab.id === value);

const tabFromHash = (): DashboardTabId => {
  const hash = window.location.hash.slice(1);
  return isTabId(hash) ? hash : "overview";
};

/** A tab whose real content hasn't been built yet. */
export function TabPlaceholder({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="max-w-md text-gray-600">{children}</div>
    </section>
  );
}

/**
 * The dashboard's seven tabs. The open tab is kept in the URL hash, e.g.
 * /dashboard#history, so a tab can be linked to and survives a reload; a
 * plain `<a href="#history">` anywhere on the page switches to it.
 */
export default function DashboardTabs({
  panels,
}: {
  panels: Record<DashboardTabId, ReactNode>;
}) {
  const [active, setActive] = useState<DashboardTabId>("overview");
  const tabRefs = useRef<Partial<Record<DashboardTabId, HTMLButtonElement>>>(
    {},
  );

  useEffect(() => {
    const sync = () => setActive(tabFromHash());
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const select = (id: DashboardTabId, focus = false) => {
    setActive(id);
    // replaceState rather than setting location.hash, so switching tabs
    // doesn't pile up history entries or scroll to an anchor.
    const { pathname, search } = window.location;
    window.history.replaceState(
      null,
      "",
      id === "overview" ? `${pathname}${search}` : `${pathname}${search}#${id}`,
    );
    if (focus) tabRefs.current[id]?.focus();
  };

  // Arrow keys, Home and End move between tabs, per the WAI-ARIA tabs pattern.
  const onKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const last = DASHBOARD_TABS.length - 1;
    const next =
      event.key === "ArrowRight"
        ? index === last
          ? 0
          : index + 1
        : event.key === "ArrowLeft"
          ? index === 0
            ? last
            : index - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    const tab = next === null ? undefined : DASHBOARD_TABS[next];
    if (!tab) return;
    event.preventDefault();
    select(tab.id, true);
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label="Dashboard sections"
        className="flex overflow-x-auto border-b border-gray-300"
      >
        {DASHBOARD_TABS.map((tab, index) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(element) => {
                if (element) tabRefs.current[tab.id] = element;
              }}
              type="button"
              role="tab"
              id={`dashboard-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={selected ? `dashboard-panel-${tab.id}` : undefined}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(tab.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={cn(
                "-mb-px shrink-0 whitespace-nowrap border-b-2 px-4 py-2 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                selected
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-600 hover:text-gray-900",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`dashboard-panel-${active}`}
        aria-labelledby={`dashboard-tab-${active}`}
        tabIndex={0}
        className="pt-8 focus-visible:outline-none"
      >
        {panels[active]}
      </div>
    </div>
  );
}
