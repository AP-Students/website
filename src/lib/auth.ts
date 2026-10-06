import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
  confirmPasswordReset,
  applyActionCode,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase"; // Firestore instance
import { useRouter } from "next/navigation";
import { type FirebaseAuthError } from "node_modules/firebase-admin/lib/utils/error";
import { useUser } from "@/components/hooks/UserContext";
import { getSafeRedirectPath } from "@/lib/redirect";

export const useAuthHandlers = () => {
  const router = useRouter();
  const { updateUser } = useUser(); // Get the updateUser function

  // Someone sent here to sign in before submitting an FRQ goes back to it, not
  // to the homepage. `replace` drops the sign-in page from the history, so the
  // FRQ's "Return to the unit" (a history back) still lands on the unit.
  const leaveAuthPage = () => {
    const redirectPath = getSafeRedirectPath(
      new URLSearchParams(window.location.search).get("redirect"),
    );

    if (redirectPath) {
      router.replace(redirectPath);
    } else {
      router.push("/");
    }
  };

  const getMessageFromCode = (code: string): string | undefined => {
    return code.split("/").pop()?.replaceAll("-", " ");
  };

  const signUpWithEmail = async (
    username: string,
    email: string,
    password: string,
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      const defaultPhotoURL =
        "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg";

      await updateProfile(user, {
        displayName: username,
        photoURL: defaultPhotoURL,
      });

      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: username,
        photoURL: defaultPhotoURL,
        access: "user",
        createdWith: "email",
      });

      leaveAuthPage();
      await updateUser();
    } catch (e: unknown) {
      const error = e as FirebaseAuthError;

      throw {
        code: error.code,
        message:
          error.message ??
          getMessageFromCode(error.code) ??
          "There was an error in sign up",
      };
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      // Check if user data exists in Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        throw {
          code: "auth/invalid-email",
        };
      }


      leaveAuthPage();
      await updateUser();
      return userCredential;
    } catch (e: unknown) {
      const error = e as FirebaseAuthError;
      throw {
        code: error.code,
        message:
          error.message ??
          getMessageFromCode(error.code) ??
          "There was an error in login",
      };
    }
  };

  const signUpWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();

      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          access: "user", // Default access level
          createdWith: "google",
        });
      }

      leaveAuthPage();
      await updateUser();
    } catch (e: unknown) {
      const error = e as FirebaseAuthError;
      throw {
        code: error.code,
        message:
          error.message ??
          getMessageFromCode(error.code) ??
          "There was an error signing up with Google",
      };
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (e: unknown) {
      const error = e as FirebaseAuthError;
      throw {
        code: error.code,
        message:
          error.message ??
          getMessageFromCode(error.code) ??
          "An unknown error occurred",
      };
    }
  };

  const resetPassword = async (newPassword: string, code: string) => {
    try {
      await confirmPasswordReset(auth, code, newPassword);
    } catch (e) {
      const error = e as FirebaseAuthError;
      throw {
        code: error.code,
        message:
          error.message ?? 
          getMessageFromCode(error.code) ?? 
          "An unknown error occurred",
      };
    }
  };

  const undoEmailChange = async (code: string) => {
    await applyActionCode(auth, code);
  };

  return {
    signUpWithEmail,
    signInWithEmail,
    signUpWithGoogle,
    forgotPassword,
    resetPassword,
    undoEmailChange,
  };
};
