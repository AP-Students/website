import { auth, db } from "@/lib/firebase";
import { User as FirebaseUser } from "firebase/auth";
import { User } from "@/types/user";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

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
                displayName:
                  userData.displayName || firebaseUser.displayName || undefined,
                email: userData.email || firebaseUser.email || "",
                photoURL:
                  userData?.photoURL || firebaseUser.photoURL || undefined,
                access: userData.access || "user",
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
      reject,
    );
  });
};

// Fetch all users from Firestore
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const usersCollection = collection(db, "users");
    const usersSnapshot = await getDocs(usersCollection);
    const usersList: User[] = usersSnapshot.docs.map((doc) => ({
      uid: doc.id,
      ...(doc.data() as Omit<User, "uid">),
    }));
    return usersList;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

// Update user role in Firestore
export const updateUserRole = async (
  authUser: User | null,
  uid: string,
  newRole: "member" | "user",
): Promise<void> => {
  if (authUser && authUser.access === "admin") {
    try {
      const userDocRef = doc(db, "users", uid);
      await updateDoc(userDocRef, {
        access: newRole,
      });
      console.log(`User role updated successfully for UID: ${uid}`);
    } catch (error) {
      console.error("Error updating user role:", error);
      throw error;
    }
  } else {
    return;
  }
};
