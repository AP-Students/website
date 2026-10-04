import type { Timestamp } from "firebase/firestore";

/**
 * Dashboard data contract.
 *
 * Pure types shared by the activity API, the Firestore layer, and the dashboard
 * UI. Nothing here imports Firebase Admin, and nothing here has runtime logic.
 */

export type ActivityType = "reading" | "mcq_test" | "frq";
export type GradeStatus = "none" | "pending" | "graded" | "self_graded";

/**
 * Canonical Firestore document locations for the dashboard.
 *
 * Stats, activity events and calendars are top-level collections that only
 * the /api/activity routes write, through the Admin SDK. An event's ID,
 * `${uid}_${type}_${sourceId}`, is the idempotency key for its XP award.
 * Saved and in-progress items are client-owned, so they live under the
 * user's own document.
 */
export const dashboardDocumentPaths = {
  stats: (uid: string) => `userStats/${uid}`,
  activity: (eventId: string) => `activityEvents/${eventId}`,
  calendar: (uid: string, year: number | string) =>
    `activityCalendar/${uid}_${year}`,
  notification: (uid: string, notificationId: string) =>
    `notifications/${uid}/items/${notificationId}`,
  completedTest: (uid: string, testKey: string) =>
    `users/${uid}/completedTests/${testKey}`,
  completedSubject: (uid: string, subject: string) =>
    `users/${uid}/completedSubjects/${subject}`,
  savedItem: (uid: string, itemId: string) =>
    `users/${uid}/savedItems/${itemId}`,
  inProgress: (uid: string, itemId: string) =>
    `users/${uid}/inProgress/${itemId}`,
} as const;

export interface ActivityEvent {
  id: string; // `${uid}_${type}_${sourceId}` — the idempotency key
  userId: string;
  type: ActivityType;
  subject: string; // slug, e.g. "ap-physics-2"
  unitId: string;
  sourceId: string; // chapterId | testId | submissionId
  label: string; // "Unit 3 Test", "Gravitational Acceleration Scaling"
  href: string; // deep link for "Go to Question"
  occurredAt: Timestamp;
  dayKey: string; // "2026-09-20", computed in the USER's timezone
  xpAwarded: number;
  gradeStatus: GradeStatus;
  score?: { correct: number; total: number };
  questions?: { index: number; topic: string; correct: boolean }[]; // mcq only
}

export interface UserStats {
  uid: string;
  xp: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDay: string | null; // dayKey
  timeZone: string; // IANA, e.g. "America/Los_Angeles"
  readingsCompleted: number;
  mcqTestsCompleted: number;
  problemsSolved: number; // the mockup's "432"
  frqsSubmitted: number;
  subjectsCompleted: number; // the mockup's "5"
  perSubject: Record<string, SubjectProgress>;
  updatedAt: Timestamp;
}

export interface CompletedTest {
  subject: string;
  unitId: string;
  testId: string;
  testKey: string;
  completedAt: Timestamp;
}

export interface CompletedSubject {
  subject: string;
  /** Curriculum snapshot when the subject was first completed. */
  requiredTestKeys: string[];
  completedAt: Timestamp;
}

export interface SubjectProgress {
  /** Server-only one-time migration of legacy MCQ activity to stable receipts. */
  completionReceiptsMigrated?: boolean;
  subjectSlug: string;
  attempted: number;
  correct: number;
  readingsCompleted: number;
  totalReadings: number;
  lastActiveAt: Timestamp;
}

export interface ActivityCalendar {
  uid: string;
  year: number;
  days: Record<string, number>; // "2026-09-20" -> 3
  updatedAt: Timestamp;
}

/** World-readable mirror of a user's stats. No email, no role, ever. */
export interface PublicProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  problemsSolved: number;
  achievementCount: number;
  updatedAt: Timestamp;
}

export type NotificationType = "level_up" | "achievement" | "frq_graded";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string;
  createdAt: Timestamp;
  readAt: Timestamp | null;
  expiresAt: Timestamp | null; // Set a timestamp once retention is configured; TTL ignores null.
}

export interface SavedItem {
  id: string;
  kind: "question" | "reading";
  subject: string;
  unitId: string;
  refId: string; // testId | chapterId
  questionIndex?: number; // questions only — order-fragile, hence:
  label: string; // SNAPSHOT, survives a test reorder
  topic?: string;
  href: string;
  savedAt: Timestamp;
}

export interface InProgressItem {
  id: string;
  kind: "mcq_test" | "frq";
  subject: string;
  unitId: string;
  refId: string;
  label: string;
  href: string;
  startedAt: Timestamp;
  updatedAt: Timestamp;
  state: McqTestState | FrqDraftState;
}

export interface McqTestState {
  answers: Record<number, string[]>;
  currentIndex: number;
  secondsRemaining: number;
}

export interface FrqDraftState {
  responses: Record<string, string>;
}

/** Readings-in-progress are DERIVED from chapterData, not stored. */
export interface InProgressReading {
  kind: "reading";
  subject: string;
  unitId: string;
  chapterId: string;
  label: string;
  href: string;
  progress: "Reading" | "Practicing" | "Need Review";
}

/** Every /api/activity/* route returns exactly this. */
export interface ActivityAwardResponse {
  xpAwarded: number;
  totalXp: number;
  level: number;
  leveledUp: boolean;
  currentStreak: number;
  newlyUnlocked: string[]; // achievement ids
  alreadyRecorded: boolean; // true on idempotent replay
}
