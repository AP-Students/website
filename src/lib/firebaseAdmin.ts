import admin from "firebase-admin";
import { env } from "@/env.js"

const serviceAccount = JSON.parse(
  env.FIREBASE_SERVICE_ACCOUNT_KEY,
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://<your-project-id>.firebaseio.com",
  });
}

export const auth = admin.auth();
export const db = admin.firestore();
