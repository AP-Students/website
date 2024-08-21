import { auth } from "@/lib/firebase";
import { User as FirebaseUser } from "firebase/auth";
import { User } from "@/types/user";

export const getUser = async (): Promise<User | null> => {
  return new Promise<User | null>((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const idTokenResult = await firebaseUser.getIdTokenResult();
          const mappedUser: User = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || undefined,
            email: firebaseUser.email || '',
            photoURL: firebaseUser.photoURL || undefined,
            admin: !!idTokenResult.claims.admin || false,
          };
          resolve(mappedUser);
        } catch (error) {
          reject(error);
        }
      } else {
        resolve(null);
      }
      unsubscribe();
    }, reject);
  });
};
