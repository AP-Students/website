import { Timestamp } from "firebase/firestore";
import { pathContext } from "../savedItemPayload.ts";
import type {
  FrqDraftState,
  InProgressItem,
  InProgressReading,
  McqTestState,
} from "@/types/dashboard";

/**
 * What a student has started and not finished: practice tests and FRQ drafts
 * saved part-way under `users/{uid}/inProgress`, and chapters whose progress
 * in `users/{uid}/chapterData` is one of `IN_PROGRESS_READING_STATUSES`.
 *
 * Both are written by the student's own browser, so a document can be missing
 * fields or hold a shape from an older version, and a chapter marked before
 * its title and link were recorded has neither. Anything the list can't show
 * or link to is left out, rather than shown half-filled.
 *
 * Kept free of React and of Firestore reads, so it can be tested on its own.
 */

export type InProgressEntry = InProgressItem | InProgressReading;

/** One stored document: its id, and what it holds. */
export interface StoredDocument {
  id: string;
  data: Record<string, unknown>;
}

export const IN_PROGRESS_READING_STATUSES = [
  "Reading",
  "Practicing",
  "Need Review",
] as const satisfies readonly InProgressReading["progress"][];

export const isInProgressReadingStatus = (
  value: unknown,
): value is InProgressReading["progress"] =>
  (IN_PROGRESS_READING_STATUSES as readonly unknown[]).includes(value);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

/** Links stay on this site. */
const isSitePath = (value: unknown): value is string =>
  isText(value) && value.startsWith("/") && !value.startsWith("//");

const isCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

function readMcqTestState(value: unknown): McqTestState | null {
  if (!isRecord(value) || !isRecord(value.answers)) return null;
  const { answers, currentIndex, secondsRemaining } = value;
  if (!isCount(currentIndex) || !isCount(secondsRemaining)) return null;

  const read: Record<number, string[]> = {};
  for (const [index, choices] of Object.entries(answers)) {
    if (
      !/^\d+$/.test(index) ||
      !Array.isArray(choices) ||
      !choices.every((choice) => typeof choice === "string")
    ) {
      return null;
    }
    read[Number(index)] = choices;
  }
  return { answers: read, currentIndex, secondsRemaining };
}

function readFrqDraftState(value: unknown): FrqDraftState | null {
  if (!isRecord(value) || !isRecord(value.responses)) return null;
  const { responses } = value;
  return Object.values(responses).every(
    (response) => typeof response === "string",
  )
    ? { responses: responses as Record<string, string> }
    : null;
}

/** A saved practice test or FRQ draft, or null when it can't be shown. */
export function readInProgressItem({
  id,
  data,
}: StoredDocument): InProgressItem | null {
  const { kind, subject, unitId, refId, label, href, startedAt, updatedAt } =
    data;
  if (
    (kind !== "mcq_test" && kind !== "frq") ||
    !isText(subject) ||
    !isText(unitId) ||
    !isText(refId) ||
    !isText(label) ||
    !isSitePath(href) ||
    !(startedAt instanceof Timestamp) ||
    !(updatedAt instanceof Timestamp)
  ) {
    return null;
  }

  const state =
    kind === "mcq_test"
      ? readMcqTestState(data.state)
      : readFrqDraftState(data.state);
  if (!state) return null;

  return {
    id,
    kind,
    subject,
    unitId,
    refId,
    label,
    href,
    startedAt,
    updatedAt,
    state,
  };
}

/**
 * A chapter the student is still working through, or null when it's not in
 * progress or can't be linked to. The document id is the chapter id.
 */
export function readInProgressReading({
  id,
  data,
}: StoredDocument): InProgressReading | null {
  const { progress, subject, unitId, label, href, updatedAt } = data;
  if (
    !isInProgressReadingStatus(progress) ||
    !isText(subject) ||
    !isText(unitId) ||
    !isText(label) ||
    !isSitePath(href) ||
    !(updatedAt instanceof Timestamp)
  ) {
    return null;
  }

  return {
    kind: "reading",
    subject,
    unitId,
    chapterId: id,
    label,
    href,
    progress,
    updatedAt,
  };
}

/** Unique across both lists, so it can key a row. */
export const inProgressEntryId = (entry: InProgressEntry) =>
  entry.kind === "reading" ? `reading-${entry.chapterId}` : entry.id;

/**
 * Everything in progress, newest first: whatever the student touched last
 * leads. Entries saved at the same moment keep a fixed order.
 */
export function readInProgress(
  items: StoredDocument[],
  chapters: StoredDocument[],
): InProgressEntry[] {
  return [
    ...items.map(readInProgressItem),
    ...chapters.map(readInProgressReading),
  ]
    .filter((entry): entry is InProgressEntry => entry !== null)
    .sort(
      (a, b) =>
        b.updatedAt.toMillis() - a.updatedAt.toMillis() ||
        inProgressEntryId(a).localeCompare(inProgressEntryId(b)),
    );
}

/**
 * What the chapter tracker saves beside a chapter's progress so the chapter
 * can be listed and linked to: its subject, unit, title and page. Null away
 * from a chapter page, e.g. in the admin editor's preview.
 */
export function chapterListing(path: string, title: string) {
  const context = pathContext(path);
  if (!context) return null;
  return {
    subject: context.subject,
    unitId: context.unitId,
    label: (title.trim() || "Untitled").slice(0, 200),
    href: path,
  };
}
