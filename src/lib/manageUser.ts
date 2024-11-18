import { auth, db } from "@/lib/firebase";
import { updateProfile, verifyBeforeUpdateEmail } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { resolve } from "path";

/**
 * Updates the user's display name in Firestore.
 * @param uid - The user's unique identifier.
 * @param displayName - The new display name to set.
 */
async function updateDisplayName(
  uid: string,
  displayName: string,
): Promise<void> {
  if (!uid || !displayName) {
    throw new Error("User ID and display name are required.");
  }

  const user = auth.currentUser;
  if (!user) {
    throw new Error("No user logged in");
  }
  await updateProfile(user, { displayName });
  const userDocRef = doc(db, "users", uid);
  await updateDoc(userDocRef, { displayName });
}

/**
 * Updates the user's email in Firebase Authentication and Firestore.
 * @param uid - The user's unique identifier.
 * @param email - The new email to set.
 */
async function updateEmailAddress(uid: string, email: string): Promise<void> {
  if (!uid || !email) {
    throw new Error("User ID and email are required.");
  }

  const user = auth.currentUser;
  if (!user) {
    throw new Error("No authenticated user found.");
  }

  await verifyBeforeUpdateEmail(user, email, null);

  // Poll for email verification by checking if it has been updated
  const timeoutMs = 3 * 1000;
  const intervalMs = 3 * 1000;
  const startTime = Date.now();
  await new Promise<void>((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        if (auth.currentUser) {
          await auth.currentUser.reload();
          if (auth.currentUser.email == email) {
            clearInterval(interval);
						resolve()
          }
        }
      } catch (error) {
        clearInterval(interval);
				reject(new Error("Failed to reload user: " + error?.message));
      }

      if (Date.now() - startTime > timeoutMs) {
        clearInterval(interval);
        reject(new Error("Timeout waiting for email verification from new email"));
      }
    }, intervalMs);
  });

  const userDocRef = doc(db, "users", uid);
  await updateDoc(userDocRef, { email });
}

/**
 * Updates the user's photoURL in Firestore after validation.
 * @param uid - The user's unique identifier.
 * @param photoURL - The new photo URL to set.
 */
async function updatePhotoURL(uid: string, photoURL: string): Promise<void> {
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
    throw new Error("No user logged in");
  }
  await updateProfile(user, { photoURL });
  const userDocRef = doc(db, "users", uid);
  await updateDoc(userDocRef, { photoURL });
}

export { updateDisplayName, updateEmailAddress, updatePhotoURL };
