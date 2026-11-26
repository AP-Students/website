import { env } from "@/env.js";
import config from "../../firebase.emulator.json";
import { firestoreDocumentsBase, usesFirebaseEmulators } from "./firebase-mode.js";

export const localFirebase = usesFirebaseEmulators(
  process.env.NODE_ENV, process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS,
);
export const endpoints = config.emulators;
export const documentsBase = firestoreDocumentsBase(
  env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  localFirebase,
  endpoints.firestore,
);
