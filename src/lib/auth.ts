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
import { useRouter } from "next/router";

export const useAuthHandlers = () => {
  const router = useRouter();

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

      await router.push("/");
    } catch (error: any) {
      throw {
        code: error.code,
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

      await router.push("/");
      return userCredential;
    } catch (error: any) {
      throw {
        code: error.code,
        message: error.message || "An error occurred during sign-in",
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
        // throw error if user doesn't exist in Firestore
      }

      await router.push("/");
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error("Error sending password reset email:", error);
      throw{
        code: error.code,
        message: error.message || "An error occurred during forgot password",
      }
    }
  };

  const checkUserExists = async (email: string) => {
    try {
      const userDocRef = doc(db, "users", email);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        return true;
      } else {
        return false;
      };
    } catch (error) {
      console.error("Error getting user:", error);
      return false;
    }
  };

  return {
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    forgotPassword,
    checkUserExists,
  };
};
