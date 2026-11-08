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
 * whichever copy is newer. Submitting deletes both. A signed-out visitor's
 * answers are kept only in the browser, and join the account's draft when
 * they sign in.
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
 * Whose browser copy a signed-out visitor's answers are kept under. They need
 * an account to submit, and signing in navigates away from the FRQ, so their
 * work waits here until they come back. Firebase uids are 28-character random
 * strings, so this can't collide with a real account.
 */
export const GUEST_DRAFT_OWNER = "guest";

export type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/**
 * Moves what a visitor wrote while signed out onto the account they just
 * signed in with, so having to sign in to submit never costs them the
 * attempt. `start` is what the account would open with otherwise. A guest
 * answer replaces the account's answer for the same part because it's the
 * newer work; a part the guest left blank keeps the account's.
 *
 * The merged answers are written to the account's browser copy as its newest,
 * and only then is the guest copy removed, so it's claimed once. If that
 * write fails, e.g. localStorage is full, the guest copy stays to be claimed
 * next time and the account opens with `start`.
 */
export function claimGuestDraft(
  storage: DraftStorage,
  templateId: string,
  uid: string,
  start: Responses,
  now: number,
): Responses {
  const guestKey = backupKey(templateId, GUEST_DRAFT_OWNER);
  try {
    const guestAnswers = Object.entries(
      readBackup(storage.getItem(guestKey))?.responses ?? {},
    ).filter(([, response]) => hasResponseText(response));
    if (guestAnswers.length === 0) {
      storage.removeItem(guestKey);
      return start;
    }
    const merged = { ...start, ...Object.fromEntries(guestAnswers) };
    storage.setItem(backupKey(templateId, uid), writeBackup(merged, now));
    storage.removeItem(guestKey);
    return merged;
  } catch {
    // A full or disabled localStorage should not interrupt the attempt.
    return start;
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
