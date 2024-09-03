import { auth, db } from "@/lib/firebase"; 
import { User as FirebaseUser } from "firebase/auth";
import { User } from "@/types/user";
import { doc, getDoc } from "firebase/firestore"; 

export const getUser = async (): Promise<User | null> => {
  return new Promise<User | null>((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(
      async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          try {
            const userDocRef = doc(db, "users", firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
              const userData = userDoc.data();
              const mappedUser: User = {
                uid: firebaseUser.uid,
                displayName: userData.displayName || firebaseUser.displayName || undefined,
                email: userData.email || firebaseUser.email || "",
                photoURL: userData?.photoURL || firebaseUser.photoURL || undefined,
                admin: userData.admin || false, 
              };
              resolve(mappedUser);
            } else {
              resolve(null);
            }
          } catch (error) {
            reject(error);
          }
        } else {
          resolve(null);
        }
        unsubscribe();
      },
      reject
    );
  });
};
