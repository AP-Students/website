import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
  /\\n/g,
  "\n",
);
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

/**
 * Cloud runtimes can use Application Default Credentials. Local development
 * needs either those credentials or the three FIREBASE_ADMIN_* variables.
 */
export const hasExplicitAdminCredentials = Boolean(
  projectId && clientEmail && privateKey,
);

// Created on first use, not on import: `next build` imports every route to
// collect page data, and parsing a placeholder key there (as CI's dummy
// FIREBASE_ADMIN_PRIVATE_KEY is) throws and fails the whole build.
function getAdminApp(): App {
  return (
    getApps()[0] ??
    initializeApp({
      credential:
        projectId && clientEmail && privateKey
          ? cert({ projectId, clientEmail, privateKey })
          : applicationDefault(),
    })
  );
}

export const getAdminAuth = () => getAuth(getAdminApp());
export const getAdminDb = () => getFirestore(getAdminApp());
