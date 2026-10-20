import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  PenLine,
  X,
  type LucideIcon,
} from "lucide-react";
import type { InProgressItem, SavedItem } from "@/types/dashboard";
import { findCourse } from "@/lib/dashboard/subjects";
import {
  inProgressEntryId,
  type InProgressEntry,
} from "@/lib/dashboard/inProgress";
import type { InProgressState } from "@/lib/dashboard/inProgressStore";

const MAX_ROWS = 4;

type RowKind = "mcq_test" | "frq" | "reading" | "question";

const KIND_ICONS: Record<RowKind, LucideIcon> = {
  mcq_test: ClipboardList,
  frq: PenLine,
  reading: BookOpen,
  question: CircleHelp,
};

interface Row {
  id: string;
  kind: RowKind;
  subject: string;
  unitId: string;
  label: string;
  href: string;
  detail: string;
}

function unitLabel(unitId: string): string | null {
  const match = /^unit-(\d+)/.exec(unitId);
  return match ? `Unit ${match[1]}` : null;
}

function inProgressDetail(item: InProgressItem): string {
  if ("currentIndex" in item.state) {
    const minutesLeft = Math.round(item.state.secondsRemaining / 60);
    return `On question ${item.state.currentIndex + 1} · ${minutesLeft} min left`;
  }
  return "Draft saved";
}

function inProgressRow(entry: InProgressEntry): Row {
  return {
    id: inProgressEntryId(entry),
    kind: entry.kind,
    subject: entry.subject,
    unitId: entry.unitId,
    label: entry.label,
    href: entry.href,
    detail: entry.kind === "reading" ? entry.progress : inProgressDetail(entry),
  };
}

function ItemList({
  title,
  rows,
  empty,
  failed,
  onRemove,
  limit = MAX_ROWS,
}: {
  title: string;
  /** Undefined while loading. */
  rows: Row[] | undefined;
  empty: string;
  /** Shown instead of the rows when they couldn't be loaded. */
  failed?: string;
  /** When set, each row gets a remove button. */
  onRemove?: (id: string) => void;
  /** How many rows to show. The overview card shows a few; a tab shows all. */
  limit?: number;
}) {
  return (
    <section>
      <h2 className="mb-3 text-2xl font-bold">{title}</h2>
      {failed ? (
        <p role="alert" className="rounded-md bg-red-100 p-4 text-red-700">
          {failed}
        </p>
      ) : rows === undefined ? (
        <p role="status" className="text-gray-500">
          Loading…
        </p>
      ) : rows.length === 0 ? (
        <p className="text-gray-500">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.slice(0, limit).map((row) => {
            const Icon = KIND_ICONS[row.kind];
            const subjectName = findCourse(row.subject)?.name ?? row.subject;
            const context = [subjectName, unitLabel(row.unitId)]
              .filter(Boolean)
              .join(" | ");

            return (
              <li key={row.id} className="flex gap-2">
                <Link
                  href={row.href}
                  className="flex min-w-0 grow items-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 grow">
                    <span className="block truncate text-xs text-gray-500">
                      {context}
                    </span>
                    <span className="block truncate font-semibold">
                      {row.label}
                    </span>
                    <span className="block truncate text-sm text-gray-600">
                      {row.detail}
                    </span>
                  </span>
                  <ChevronRight
                    className="h-5 w-5 shrink-0 text-gray-400"
                    aria-hidden="true"
                  />
                </Link>
                {onRemove && (
                  <button
                    type="button"
                    onClick={() => onRemove(row.id)}
                    aria-label={`Remove "${row.label}" from saved`}
                    title="Remove from saved"
                    className="flex shrink-0 items-center rounded-lg border border-gray-300 bg-white px-3 text-gray-500 shadow-sm transition-colors hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Shows `useInProgress`'s list in its order, newest first. */
export function InProgressList({
  inProgress,
  limit,
}: {
  inProgress: InProgressState;
  limit?: number;
}) {
  return (
    <ItemList
      title="In Progress:"
      rows={inProgress.entries?.map(inProgressRow)}
      empty="Nothing in progress. Start a practice test or reading to pick it up here later."
      failed={
        inProgress.error &&
        "Couldn't load what you're working on. Refresh to try again."
      }
      limit={limit}
    />
  );
}

export function SavedList({
  saved,
  onRemove,
  limit,
}: {
  saved: SavedItem[];
  /** Removes a saved item by id. Rows show a remove button when set. */
  onRemove?: (id: string) => void;
  limit?: number;
}) {
  const rows: Row[] = saved.map((item) => ({
    id: item.id,
    kind: item.kind,
    subject: item.subject,
    unitId: item.unitId,
    label: item.label,
    href: item.href,
    detail:
      item.topic ??
      (item.kind === "reading" ? "Saved reading" : "Saved question"),
  }));

  return (
    <ItemList
      title="Saved:"
      rows={rows}
      empty="No saved items yet. Bookmark a question or reading to find it here."
      onRemove={onRemove}
      limit={limit}
    />
  );
}

interface SavedAndInProgressProps {
  saved: SavedItem[];
  inProgress: InProgressState;
  /** Removes a saved item by id. Saved rows show a remove button when set. */
  onRemoveSaved?: (id: string) => void;
}

export default function SavedAndInProgress({
  saved,
  inProgress,
  onRemoveSaved,
}: SavedAndInProgressProps) {
  return (
    <div className="flex flex-col gap-8">
      <InProgressList inProgress={inProgress} />
      <SavedList saved={saved} onRemove={onRemoveSaved} />
    </div>
  );
}
