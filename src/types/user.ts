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
}
