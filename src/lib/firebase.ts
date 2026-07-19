// "use client"

// import { initializeApp } from "firebase/app";
// import { getAuth } from "firebase/auth";
// import { getFirestore } from "firebase/firestore";
// import { getStorage } from "firebase/storage";

// import { env } from "@/env.js";

// const firebaseConfig = {
//   apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
//   authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//   storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//   appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
//   measurementId: env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
// };

// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);
// const auth = getAuth(app);
// const storage = getStorage(app);

// export { db, auth, storage };
// export default app;



//TO START EMULATORS, DO THIS: npx -y firebase-tools@latest emulators:start

"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { env } from "@/env.js";

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

const useEmulators =
  process.env.NODE_ENV === "development" &&
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

if (useEmulators) {
  try {
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connectAuthEmulator(auth, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
  } catch {
    // Next.js hot reload may evaluate this module after emulators are connected.
  }
}

export { app, db, auth, storage };
export default app;