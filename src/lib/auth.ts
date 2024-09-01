import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase"; // Firestore instance
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs } from "firebase/firestore";
import { FirebaseAuthError } from "node_modules/firebase-admin/lib/utils/error";

export const useAuthHandlers = () => {
  const router = useRouter();

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
        admin: false, 
      });

      router.push("/");
    } catch (e: any) {
      const error = e as FirebaseAuthError;
      console.error(error);
      throw {
        code: error.code,
        message:
          error.message ||
          getMessageFromCode(error.code) ||
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
        console.log("User doesn't exist in Firestore");
        throw {
          code: "auth/invalid-email",
        };
      }

      router.push("/");
      return userCredential;
    } catch (e: any) {
      const error = e as FirebaseAuthError;
      console.error(error);
      throw {
        code: error.code,
        message:
          error.message ||
          getMessageFromCode(error.code) ||
          "There was an error in login",
      };
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();

    try {
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if user data exists in Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        throw {
          code: "auth/invalid-email",
        };
      }

      router.push("/");
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (e: any) {
      const error = e as FirebaseAuthError;
      console.error("Error sending password reset email:", error);
      throw {
        code: error.code,
        message:
          error.message ||
          getMessageFromCode(error.code) ||
          "An unknown error occurred",
      };
    }
  };

  return {
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    forgotPassword,
  };
};
