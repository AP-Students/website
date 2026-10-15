import type { Timestamp } from "firebase/firestore";

export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  access: "admin" | "member" | "grader" | "user" | "banned";
  graderSubjectAccess?: string[];
  createdWith: "email" | "google";
  createdAt: Date;
  lastFrqResponseAt: Timestamp;
  mySubjects?: string[];
}

export interface UserChapterData {
  progress:
    | "Not Started"
    | "Reading"
    | "Practicing"
    | "Complete"
    | "Need Review"
    | "Skipped";
  /** Set by the server once the chapter's reading XP has been awarded. */
  readingXpAwarded?: boolean;
}
