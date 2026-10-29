import type { Timestamp } from "firebase/firestore";
import { hasResponseText } from "../frq/template.ts";
import { inProgressItemId } from "./inProgress.ts";
import { AUTOSAVE_EVERY_MS, type Schedule } from "./testAutosave.ts";

/**
 * FRQ drafts.
 *
 * While a student writes an FRQ, their answers are kept in two places. Every
 * few seconds they're saved to `users/{uid}/inProgress`, as the item the
 * dashboard's In Progress list shows and any device can pick up. On every
 * change they're also copied to this browser's localStorage, as a backup for
 * when a save can't reach the server. Opening the FRQ again starts from
 * whichever copy is newer. Submitting deletes both.
 *
 * Kept free of React and of Firestore, so it can be tested on its own;
 * `useFrqDraft` connects it to both.
 */

/** Answers keyed by part id, as the FRQ renderer and submissions keep them. */
export type Responses = Record<string, string>;

/** Where an FRQ lives. `unitId` is the unit's Firestore id, not "unit-3". */
export interface FrqSource {
  subject: string;
  unitId: string;
  templateId: string;
}

/** The id of an FRQ's draft in `users/{uid}/inProgress`. */
export const frqDraftId = (source: FrqSource) =>
  inProgressItemId("frq", {
    subject: source.subject,
    unitId: source.unitId,
    refId: source.templateId,
  });

/**
 * Subject slug, unit and FRQ id for an FRQ page such as
 * `/subject/biology/unit-1-xgxskm69/frq/abc`. As with saved items, only
 * `unit-{displayNumber}` is kept, the form the dashboard turns into "Unit 1".
 * Null on every other page, e.g. an admin preview.
 */
export function frqPathContext(path: string) {
  const match = /^\/subject\/([^/]+)\/(unit-\d+)(?:-[^/]+)?\/frq\/([^/]+)/.exec(
    path,
  );
  if (!match) return null;
  return { subject: match[1]!, unitId: match[2]!, refId: match[3]! };
}

/** The saved draft document, apart from `updatedAt`, which the server stamps. */
export function frqDraftDocument(input: {
  context: NonNullable<ReturnType<typeof frqPathContext>>;
  label: string;
  href: string;
  startedAt: Timestamp;
  responses: Responses;
}) {
  const { context, label, href, startedAt, responses } = input;
  return {
    kind: "frq" as const,
    subject: context.subject,
    unitId: context.unitId,
    refId: context.refId,
    label: (label.trim() || "FRQ").slice(0, 200),
    href,
    startedAt,
    state: { responses: { ...responses } },
  };
}

/** A draft has something in it once any answer has real text. */
export const isBlankDraft = (responses: Responses) =>
  !Object.values(responses).some(hasResponseText);

/** The browser's copy, and when it was written (ms since 1970; 0 if unknown). */
export interface BackupDraft {
  responses: Responses;
  savedAt: number;
}

/** The localStorage key the browser's copy lives under. */
export const backupKey = (templateId: string, studentId: string) =>
  `frq-draft:${templateId}:${studentId}`;

export const writeBackup = (responses: Responses, savedAt: number) =>
  JSON.stringify({ responses, savedAt });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const onlyText = (answers: Record<string, unknown>): Responses =>
  Object.fromEntries(
    Object.entries(answers).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );

/**
 * The browser's copy, from what localStorage holds. Copies written before
 * drafts were saved to the server are a bare map of answers, and read as
 * written at an unknown time. An unreadable copy reads as none: a corrupt
 * backup must not block the student from starting.
 */
export function readBackup(stored: string | null): BackupDraft | null {
  if (!stored) return null;
  try {
    const parsed: unknown = JSON.parse(stored);
    if (!isRecord(parsed)) return null;
    if (!("responses" in parsed)) {
      return { responses: onlyText(parsed), savedAt: 0 };
    }
    if (!isRecord(parsed.responses)) return null;
    return {
      responses: onlyText(parsed.responses),
      savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : 0,
    };
  } catch {
    return null;
  }
}

/**
 * The answers to start from: the newer of the saved draft (`updatedAt` in
 * ms) and the browser's copy. The browser's copy is newer when the last
 * saves didn't reach the server, e.g. while offline.
 */
export function startingDraft(
  saved: { responses: Responses; updatedAt: number } | null,
  backup: BackupDraft | null,
): Responses {
  if (backup && (!saved || backup.savedAt > saved.updatedAt)) {
    return backup.responses;
  }
  return saved?.responses ?? {};
}

export interface DraftAutosave {
  /** Saves now, if anything changed since the last save. */
  flush(): void;
  /** Saves what's left unsaved and stops. The draft stays, to pick up later. */
  stop(): void;
  /** The FRQ was submitted: stops saving and deletes the draft. */
  finish(): void;
}

const everyFewSeconds: Schedule = (tick, every) => {
  const timer = setInterval(tick, every);
  return () => clearInterval(timer);
};

/**
 * Saves a draft to the server every few seconds while it changes. Nothing is
 * saved while it's blank, so an FRQ a student only opened doesn't sit on
 * their dashboard; once something is written, every change is saved,
 * including clearing it again.
 */
export function createDraftAutosave(options: {
  /** The answers as they stand now. */
  read: () => Responses;
  save: (responses: Responses) => Promise<void>;
  remove: () => Promise<void>;
  schedule?: Schedule;
}): DraftAutosave {
  const { read, save, remove, schedule = everyFewSeconds } = options;
  let running = true;
  let finished = false;
  let started = false;
  // What the last save sent, to skip ticks where nothing changed.
  let lastSaved: string | undefined;

  const flush = () => {
    if (!running) return;
    const responses = read();
    if (!started) {
      if (isBlankDraft(responses)) return;
      started = true;
    }
    const sent = JSON.stringify(responses);
    if (sent === lastSaved) return;
    lastSaved = sent;
    save(responses).catch((error) => {
      console.error("Error saving FRQ draft:", error);
      // Sent again on the next tick, unless something newer went out since.
      if (lastSaved === sent) lastSaved = undefined;
    });
  };
  const cancel = schedule(flush, AUTOSAVE_EVERY_MS);
  const halt = () => {
    running = false;
    cancel();
  };

  return {
    flush,
    stop() {
      flush();
      halt();
    },
    finish() {
      if (finished) return;
      finished = true;
      halt();
      // Firestore applies one client's writes in the order they were made,
      // so this lands after any save still on its way.
      remove().catch((error) =>
        console.error("Error clearing FRQ draft:", error),
      );
    },
  };
}
