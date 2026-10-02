import type {
  ActivityEvent,
  ActivityType,
  GradeStatus,
} from "@/types/dashboard";

/**
 * The submission-history table's rows, worked out from activity events.
 * Kept free of React so the links and labels can be tested on their own.
 */

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  reading: "Reading",
  mcq_test: "MCQ Test",
  frq: "FRQ",
};

const FRQ_STATUS: Record<GradeStatus, string> = {
  none: "Submitted",
  pending: "Awaiting grade",
  graded: "Graded",
  self_graded: "Self-graded",
};

export interface HistoryRow {
  id: string;
  type: ActivityType;
  typeLabel: string;
  subject: string;
  unitId: string;
  label: string;
  /** The student's own calendar day, e.g. "Sep 20, 2026". */
  date: string;
  status: string;
  href: string;
  action: string;
}

/**
 * "2026-09-20" -> "Sep 20, 2026". A day key is already the student's day in
 * their own time zone, so it is shown as a plain date, never converted.
 */
export function formatDayKey(dayKey: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
  if (!match) return dayKey;
  const [, year, month, day] = match.map(Number);
  return new Date(Date.UTC(year!, month! - 1, day)).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" },
  );
}

export function toHistoryRow(event: ActivityEvent): HistoryRow {
  let status = "Completed";
  let href = event.href;
  let action = "Open reading";

  if (event.type === "frq") {
    status = FRQ_STATUS[event.gradeStatus];
    // A graded FRQ's id is its submission's, which is also the id of its
    // result in graded-frqs or self-graded-frqs, where the feedback page
    // looks it up.
    if (event.gradeStatus === "graded" || event.gradeStatus === "self_graded") {
      href = `/frq-feedback/${event.sourceId}`;
      action = "View feedback";
    } else {
      action = "View FRQ";
    }
  } else if (event.type === "mcq_test") {
    status = event.score
      ? `${event.score.correct}/${event.score.total} correct`
      : "Completed";
    action = "View test";
  }

  return {
    id: event.id,
    type: event.type,
    typeLabel: ACTIVITY_TYPE_LABELS[event.type],
    subject: event.subject,
    unitId: event.unitId,
    label: event.label,
    date: formatDayKey(event.dayKey),
    status,
    href,
    action,
  };
}

const millis = (timestamp: ActivityEvent["occurredAt"] | null | undefined) =>
  typeof timestamp?.toMillis === "function" ? timestamp.toMillis() : 0;

/** Every event as a history row, newest first. */
export function toHistoryRows(events: readonly ActivityEvent[]): HistoryRow[] {
  return [...events]
    .sort((a, b) => millis(b.occurredAt) - millis(a.occurredAt))
    .map(toHistoryRow);
}
