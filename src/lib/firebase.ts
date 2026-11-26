"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectStorageEmulator, getStorage } from "firebase/storage";

import { env } from "@/env.js";
import { endpoints, localFirebase } from "./firebase-routing";

import { firebaseConfigForMode } from "./firebase-mode.js";

const firebaseConfig = firebaseConfigForMode({
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}, localFirebase);

const existingApp = localFirebase ? getApps().find((app) => app.name === "[DEFAULT]") : undefined;
const app = existingApp ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Keep the connection marker through Fast Refresh, keyed by SDK app instance.
if (localFirebase) {
  const runtime = globalThis as typeof globalThis & { localFirebaseApps?: WeakSet<FirebaseApp> };
  const connected = runtime.localFirebaseApps ??= new WeakSet();
  if (!connected.has(app)) {
    connectAuthEmulator(auth, `http://${endpoints.auth.host}:${endpoints.auth.port}`);
    connectFirestoreEmulator(db, endpoints.firestore.host, endpoints.firestore.port);
    connectStorageEmulator(storage, endpoints.storage.host, endpoints.storage.port);
    connected.add(app);
  }
}

export { db, auth, storage };
export default app;
