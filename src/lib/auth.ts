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
import { collection, query, where, getDocs } from "firebase/firestore";

export const useAuthHandlers = () => {
  const router = useRouter();

  const signUpWithEmail = async (
    username: string,
    email: string,
    password: string,
  ) => {
    try {
      // Step 1: Create the user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      const defaultPhotoURL =
        "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg";

      // Step 2: Update the user's profile in Firebase Authentication
      await updateProfile(user, {
        displayName: username,
        photoURL: defaultPhotoURL,
      });

      // Step 3: Store additional user data in Firestore
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: username,
        photoURL: defaultPhotoURL,
        admin: false, // Default to non-admin; set this as needed
      });

      await router.push("/");
    } catch (error: any) {
      throw{
        code: error.code,
      }
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
          code: "auth/invalid-email"
        }  
      }

      await router.push("/");
      return userCredential;
    } catch (error: any) {
      console.log(error.code);
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
        // If not, create it with default values
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          admin: false, // Default to non-admin
        });
      }

      await router.push("/");
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Error sending password reset email:", error);
    }
  };

  return {
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    forgotPassword,
  };
};
