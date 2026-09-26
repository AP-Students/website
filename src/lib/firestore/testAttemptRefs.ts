import { collection } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * One finished multiple-choice test, kept so a student's study activity
 * (the calendar, streaks, XP) can count MCQ work alongside FRQs. Only the
 * outcome is stored, not the answers: nothing downstream needs them, and a
 * record this small stays cheap to read a year of at once.
 */
export type TestAttempt = {
  subject: string;
  unitId: string;
  testId: string;
  correct: number;
  total: number;
  completedAt: Date;
};

export const getTestAttemptsCollectionRef = (userId: string) =>
  collection(db, "users", userId, "testAttempts");
