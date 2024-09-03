import admin from "firebase-admin";
import serviceAccountKey from "@/lib/serviceAccountKey.json";

const serviceAccount = serviceAccountKey.private_key;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Function to set custom claims
const setCustomClaims = async (uid: string) => {
  try {
    // Set custom user claims
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log(`Custom claims set successfully for user: ${uid}`);
  } catch (error) {
    console.error('Error setting custom claims:', error);
  }
};

// Example usage
setCustomClaims('DxMgvV6dWYOM6PmBShujOvLm52'); 