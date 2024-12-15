import { auth, db } from "@/lib/firebase";
import type { User as FirebaseUser } from "firebase/auth";
import type { User } from "@/types/user";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

let cachedUser: User | null = null;
let cacheTimestamp: number | null = null;

// Expiration time in milliseconds (1 week)
const CACHE_EXPIRATION_TIME = 7 * 24 * 60 * 60 * 1000;

// Check if cache is still valid
const isCacheValid = (): boolean => {
  if (!cacheTimestamp) return false;
  const now = Date.now();
  return now - cacheTimestamp < CACHE_EXPIRATION_TIME;
};

// Attempt to load cached user from localStorage
const loadFromLocalStorage = () => {
  if (typeof window === "undefined") return;
  const storedUser = localStorage.getItem("cachedUser");
  const storedTimestamp = localStorage.getItem("cacheTimestamp");
  if (storedUser && storedTimestamp) {
    /* eslint-disable @typescript-eslint/no-unsafe-assignment */
    const parsedUser: User = JSON.parse(storedUser);
    /* eslint-enable */
    const timestamp = parseInt(storedTimestamp, 10);
    if (Date.now() - timestamp < CACHE_EXPIRATION_TIME) {
      cachedUser = parsedUser;
      cacheTimestamp = timestamp;
    } else {
      localStorage.removeItem("cachedUser");
      localStorage.removeItem("cacheTimestamp");
    }
  }
};

// Save user to localStorage
const saveToLocalStorage = (user: User) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("cachedUser", JSON.stringify(user));
  localStorage.setItem("cacheTimestamp", Date.now().toString());
};

// Fetch only user access from Firestore
export const getUserAccess = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (user) {
    const userAccessDoc = await getDoc(doc(db, "users", user.uid));
    if (userAccessDoc.exists()) {
      const accessLevel = userAccessDoc.get("access") as string;
      return accessLevel;
    }
  }
  return null;
};

const getUserAuthProvider = () => {
  const user = auth.currentUser;
  let provider = "";
  if (user) {
    user.providerData.forEach((info) => {
      if (info.providerId === "password" && provider !== "google") {
        provider = "email";
      } else if (info.providerId === "google.com") {
        provider = "google";
      }
    })
  }
  return provider;
};

export const getUser = async (): Promise<User | null> => {
  // Attempt to load from localStorage if not already loaded
  if (!cachedUser) {
    loadFromLocalStorage();
  }

  // If we have a cached user and it's still valid, return it
  if (cachedUser && isCacheValid()) {
    return cachedUser;
  }

  // Otherwise, fetch from Firebase Auth state
  return new Promise<User | null>((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(
      (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser === null) {
          resolve(null);
          unsubscribe();
          return;
        }

        const fetchUserData = async () => {
          try {
            const userDocRef = doc(db, "users", firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
              const userData = userDoc.data() as User;
              const mappedUser: User = {
                uid: firebaseUser.uid,
                displayName: userData.displayName ?? firebaseUser.displayName ?? "",
                email: userData.email ?? firebaseUser.email ?? "",
                photoURL: userData.photoURL ?? firebaseUser.photoURL ?? undefined,
                access: userData.access ?? "user",
                createdWith: userData.createdWith ?? getUserAuthProvider(),
                createdAt: userData.createdAt ?? new Date(0),
              };

              // Cache in memory
              cachedUser = mappedUser;
              cacheTimestamp = Date.now();

              // Save to localStorage for persistence
              saveToLocalStorage(mappedUser);

              resolve(mappedUser);
            } else {
              resolve(null);
            }
          } catch (error) {
            reject(error);
          } finally {
            unsubscribe();
          }
        };

        fetchUserData().catch((error) => {
          reject(error);
          unsubscribe();
        });
      },
      reject,
    );
  });
};

// Fetch all users from Firestore (cached in-memory only)
let users: User[] = [];

export const getAllUsers = async (): Promise<User[]> => {
  if (users.length > 0) {
    return users;
  }

  try {
    const usersCollection = collection(db, "users");
    const usersSnapshot = await getDocs(usersCollection);
    const usersList: User[] = usersSnapshot.docs.map((doc) => ({
      uid: doc.id,
      ...(doc.data() as Omit<User, "uid">),
    }));
    users = usersList;
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
  if (!authUser || authUser.access !== "admin") {
    return;
  }

  try {
    const userDocRef = doc(db, "users", uid);
    await updateDoc(userDocRef, { access: newRole });
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
};
