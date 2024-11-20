// lib/manageUser.ts
import { auth, db } from "@/lib/firebase";
import {
  updateProfile,
  deleteUser,
  updatePassword as firebaseUpdatePassword,
  updateEmail as firebaseUpdateEmail,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";

/**
 * Maps Firebase Auth errors to user-friendly messages.
 * @param error - The error thrown by Firebase Auth.
 * @returns A user-friendly error message.
 */
function mapAuthError(error: any): string {
  const errorCode = error.code;
  switch (errorCode) {
    case "auth/invalid-password":
    case "auth/wrong-password":
      return "The password is incorrect.";
    case "auth/user-disabled":
      return "The user account has been disabled.";
    case "auth/user-not-found":
      return "No user found for this action.";
    case "auth/email-already-in-use":
      return "The email address is already in use by another account.";
    case "auth/invalid-email":
      return "The email address is invalid.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/requires-recent-login":
      return "Please reauthenticate and try again.";
    default:
      return "An error occurred. Please try again.";
  }
}

/**
 * Updates the user's display name in Firebase Authentication and Firestore.
 * @param uid - The user's unique identifier.
 * @param displayName - The new display name to set.
 */
export async function updateDisplayName(
  uid: string,
  displayName: string
): Promise<void> {
  if (!uid || !displayName) {
    throw new Error("User ID and display name are required.");
  }

  const user = auth.currentUser;
  if (!user) {
    throw new Error("No user is currently authenticated.");
  }

  try {
    await updateProfile(user, { displayName });
    const userDocRef = doc(db, "users", uid);
    await updateDoc(userDocRef, { displayName });
  } catch (error: any) {
    throw mapAuthError(error);
  }
}