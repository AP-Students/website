import Link from "next/link";
import { History } from "lucide-react";
import type { ActivityEvent, ActivityType } from "@/types/dashboard";
import { toHistoryRows, type HistoryRow } from "@/lib/dashboard/history";
import { findCourse } from "@/lib/dashboard/subjects";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TYPE_BADGE: Record<ActivityType, string> = {
  reading: "bg-blue-100 text-blue-800",
  mcq_test: "bg-orange-100 text-orange-800",
  frq: "bg-purple-100 text-purple-800",
};

function unitLabel(unitId: string): string | null {
  const match = /^unit-(\d+)/.exec(unitId);
  return match ? `Unit ${match[1]}` : null;
}

function context(row: HistoryRow): string {
  const subjectName = findCourse(row.subject)?.name ?? row.subject;
  return [subjectName, unitLabel(row.unitId)].filter(Boolean).join(" | ");
}

function TypeBadge({ row }: { row: HistoryRow }) {
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold",
        TYPE_BADGE[row.type],
      )}
    >
      {row.typeLabel}
    </span>
  );
}

function RowLink({ row }: { row: HistoryRow }) {
  return (
    <Link
      href={row.href}
      aria-label={`${row.action}: ${row.label}`}
      className={cn(
        buttonVariants({ size: "sm", variant: "outline" }),
        "whitespace-nowrap rounded-full",
      )}
    >
      {row.action}
    </Link>
  );
}

/**
 * Every reading, MCQ test and FRQ the student has finished, newest first.
 * Graded FRQs link to their feedback; everything else links back to itself.
 */
export default function SubmissionHistory({
  events,
}: {
  events: ActivityEvent[];
}) {
  const rows = toHistoryRows(events);

  return (
    <section aria-labelledby="submission-history-heading">
      <h2 id="submission-history-heading" className="mb-3 text-2xl font-bold">
        Submission History:
      </h2>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
          <History className="h-10 w-10 text-gray-400" aria-hidden="true" />
          <p className="text-lg font-semibold">No submissions yet</p>
          <p className="max-w-sm text-gray-600">
            Readings you complete, practice tests you finish and FRQs you submit
            will all show up here.
          </p>
          <Link href="/" className={cn(buttonVariants(), "rounded-full")}>
            Find something to study
          </Link>
        </div>
      ) : (
        <>
          {/* Phones: one card per submission, so nothing scrolls sideways. */}
          <ul className="flex flex-col gap-3 md:hidden">
            {rows.map((row) => (
              <li
                key={row.id}
                className="rounded-lg border border-gray-300 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <TypeBadge row={row} />
                  <span className="text-sm text-gray-500">{row.date}</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">{context(row)}</p>
                <p className="font-semibold">{row.label}</p>
                <p className="text-sm text-gray-600">{row.status}</p>
                <div className="mt-3">
                  <RowLink row={row} />
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-hidden rounded-lg border border-gray-300 bg-white shadow md:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Your readings, practice tests and FRQs, newest first
              </caption>
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Type
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Activity
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3">
                    <span className="sr-only">Link</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3">
                      <TypeBadge row={row} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{row.label}</p>
                      <p className="text-xs text-gray-500">{context(row)}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {row.date}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.status}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <RowLink row={row} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
