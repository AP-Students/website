import Link from "next/link";
import { BookOpen, ChevronRight, CircleHelp, ClipboardList, PenLine, type LucideIcon,} from "lucide-react";
import type { InProgressItem, InProgressReading, SavedItem } from "@/types/dashboard";
import { findCourse } from "@/lib/dashboard/subjects";

const MAX_ROWS = 4;

type RowKind = "mcq_test" | "frq" | "reading" | "question";

const KIND_ICONS: Record<RowKind, LucideIcon> = {mcq_test: ClipboardList, frq: PenLine, reading: BookOpen, question: CircleHelp};

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

function ItemList({ title, rows, empty }: { title: string; rows: Row[]; empty: string }) {
  return (
    <section>
      <h2 className="mb-3 text-2xl font-bold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-gray-500">{empty}</p>) : (
        <ul className="flex flex-col gap-3">
          {rows.slice(0, MAX_ROWS).map((row) => {
            const Icon = KIND_ICONS[row.kind];
            const subjectName = findCourse(row.subject)?.name ?? row.subject;
            const context = [subjectName, unitLabel(row.unitId)].filter(Boolean).join(" | ");

            return (
              <li key={row.id}>
                <Link href={row.href} className="flex items-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 grow">
                    <span className="block truncate text-xs text-gray-500">{context}</span>
                    <span className="block truncate font-semibold">{row.label}</span>
                    <span className="block truncate text-sm text-gray-600">{row.detail}</span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

interface SavedAndInProgressProps {
  saved: SavedItem[];
  inProgress: InProgressItem[];
  inProgressReadings: InProgressReading[];
}

export default function SavedAndInProgress({saved, inProgress, inProgressReadings}: SavedAndInProgressProps) {
  const inProgressRows: Row[] = [
    ...inProgress.map((item) => ({
      id: item.id,
      kind: item.kind,
      subject: item.subject,
      unitId: item.unitId,
      label: item.label,
      href: item.href,
      detail: inProgressDetail(item),
    })),
    ...inProgressReadings.map((reading) => ({
      id: `reading-${reading.chapterId}`,
      kind: "reading" as const,
      subject: reading.subject,
      unitId: reading.unitId,
      label: reading.label,
      href: reading.href,
      detail: reading.progress,
    })),
  ];

  const savedRows: Row[] = saved.map((item) => ({
    id: item.id,
    kind: item.kind,
    subject: item.subject,
    unitId: item.unitId,
    label: item.label,
    href: item.href,
    detail: item.topic ?? (item.kind === "reading" ? "Saved reading" : "Saved question"),
  }));

  return (
    <div className="flex flex-col gap-8">
      <ItemList
        title="In Progress:"
        rows={inProgressRows}
        empty="Nothing in progress. Start a practice test or reading to pick it up here later."
      />
      <ItemList
        title="Saved:"
        rows={savedRows}
        empty="No saved items yet. Bookmark a question or reading to find it here."
      />
    </div>
  );
}
