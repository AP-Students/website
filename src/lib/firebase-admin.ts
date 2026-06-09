import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

function getFirebaseAdmin() {
  if (getApps().length > 0) {
    return {
      adminDb: getFirestore(),
      adminAuth: getAuth(),
    };
  }

  // In development with emulators, we can initialize without credentials
  // In production, use service account credentials from env vars
  if (process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT,
    );
    initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  } else {
    // Auto-discover credentials (works in emulator and GCP environments)
    initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }

  const adminDb = getFirestore();
  const adminAuth = getAuth();

  // Connect to emulators in development
  if (process.env.NODE_ENV === "development") {
    process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
    process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
  }

  return { adminDb, adminAuth };
}

export const { adminDb, adminAuth } = getFirebaseAdmin();
