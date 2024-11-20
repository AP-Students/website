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

/**
 * Updates the user's password in Firebase Authentication.
 * Requires reauthentication.
 * @param newPassword - The new password to set.
 */
export async function updatePassword(newPassword: string): Promise<void> {
  if (!newPassword) {
    throw new Error("New password is required.");
  }

  const user = auth.currentUser;
  if (!user) {
    throw new Error("No authenticated user found.");
  }

  try {
    await firebaseUpdatePassword(user, newPassword);
  } catch (error: any) {
    throw mapAuthError(error);
  }
}

/**
 * Updates the user's photo URL in Firebase Authentication and Firestore.
 * @param uid - The user's unique identifier.
 * @param photoURL - The new photo URL to set.
 */
export async function updatePhotoURL(
  uid: string,
  photoURL: string
): Promise<void> {
  if (!uid || !photoURL) {
    throw new Error("User ID and photo URL are required.");
  }

  // Validate that the photo URL is a proper URL
  try {
    new URL(photoURL);
  } catch {
    throw new Error("Invalid photo URL.");
  }

  const user = auth.currentUser;
  if (!user) {
    throw new Error("No user is currently authenticated.");
  }

  try {
    await updateProfile(user, { photoURL });
    const userDocRef = doc(db, "users", uid);
    await updateDoc(userDocRef, { photoURL });
  } catch (error: any) {
    throw mapAuthError(error);
  }
}

/**
 * Deletes the user's account from Firebase Authentication and Firestore.
 * Requires reauthentication.
 */
export async function deleteAccount(): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No user is currently authenticated.");
  }

  const userDocRef = doc(db, "users", user.uid);

  try {
    // Delete Firestore document first
    await deleteDoc(userDocRef);
    // Then delete Firebase user
    await deleteUser(user);
    // Optionally, you can also sign out the user here if not already handled
  } catch (error: any) {
    throw mapAuthError(error);
  }
}
