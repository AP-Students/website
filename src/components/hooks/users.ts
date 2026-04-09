import { auth, db } from "@/lib/firebase";
import type { User as FirebaseUser } from "firebase/auth";
import type { User } from "@/types/user";
import {
  collection,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";

let cachedUser: User | null = null;
let cacheTimestamp: number | null = null;
let isStorageSyncInitialized = false;
let isAuthSyncInitialized = false;

const CACHED_USER_KEY = "cachedUser";
const CACHE_USER_TIMESTAMP_KEY = "cacheUserTimestamp";

// Keep cache short-lived so permission changes propagate quickly.
const CACHE_EXPIRATION_TIME = 5 * 60 * 1000;
// Revalidate access even before TTL expiry to reduce stale role windows.
const ACCESS_REVALIDATION_INTERVAL = 60 * 1000;

const shouldRevalidateAccess = (): boolean => {
  if (!cacheTimestamp) return true;
  return Date.now() - cacheTimestamp >= ACCESS_REVALIDATION_INTERVAL;
};

// Check if cache is still valid
const isCacheValid = (): boolean => {
  if (!cacheTimestamp) return false;
  const now = Date.now();
  return now - cacheTimestamp < CACHE_EXPIRATION_TIME;
};

const setCacheTimestamp = (timestamp: number) => {
  cacheTimestamp = timestamp;
  if (typeof window !== "undefined") {
    localStorage.setItem(CACHE_USER_TIMESTAMP_KEY, timestamp.toString());
  }
};

const setUserCache = (user: User) => {
  cachedUser = user;
  setCacheTimestamp(Date.now());
  if (typeof window !== "undefined") {
    localStorage.setItem(CACHED_USER_KEY, JSON.stringify(user));
  }
};

const initStorageSync = () => {
  if (typeof window === "undefined" || isStorageSyncInitialized) return;
  window.addEventListener("storage", (event) => {
    if (
      event.key !== CACHED_USER_KEY &&
      event.key !== CACHE_USER_TIMESTAMP_KEY
    ) {
      return;
    }

    const storedUser = localStorage.getItem(CACHED_USER_KEY);
    const storedTimestamp = localStorage.getItem(CACHE_USER_TIMESTAMP_KEY);

    if (!storedUser || !storedTimestamp) {
      cachedUser = null;
      cacheTimestamp = null;
      return;
    }

    try {
      const parsedUser: User = JSON.parse(storedUser);
      const timestamp = parseInt(storedTimestamp, 10);
      if (Number.isFinite(timestamp) && Date.now() - timestamp < CACHE_EXPIRATION_TIME) {
        cachedUser = parsedUser;
        cacheTimestamp = timestamp;
      } else {
        cachedUser = null;
        cacheTimestamp = null;
      }
    } catch {
      cachedUser = null;
      cacheTimestamp = null;
    }
  });
  isStorageSyncInitialized = true;
};

const initAuthSync = () => {
  if (isAuthSyncInitialized) return;
  auth.onAuthStateChanged((firebaseUser) => {
    if (!firebaseUser) {
      clearUserCache();
      return;
    }

    if (cachedUser && cachedUser.uid !== firebaseUser.uid) {
      clearUserCache();
    }
  });
  isAuthSyncInitialized = true;
};

// Checks if there is a cached user and if it's still valid
const loadFromLocalStorage = () => {
  if (typeof window === "undefined") return;
  initStorageSync();
  initAuthSync();
  const storedUser = localStorage.getItem(CACHED_USER_KEY);
  const storedTimestamp = localStorage.getItem(CACHE_USER_TIMESTAMP_KEY);
  if (storedUser && storedTimestamp) {
    try {
      /* eslint-disable @typescript-eslint/no-unsafe-assignment */
      const parsedUser: User = JSON.parse(storedUser);
      /* eslint-enable */
      const timestamp = parseInt(storedTimestamp, 10);
      if (Date.now() - timestamp < CACHE_EXPIRATION_TIME) {
        cachedUser = parsedUser;
        cacheTimestamp = timestamp;
      } else {
        localStorage.removeItem(CACHED_USER_KEY);
        localStorage.removeItem(CACHE_USER_TIMESTAMP_KEY);
      }
    } catch {
      localStorage.removeItem(CACHED_USER_KEY);
      localStorage.removeItem(CACHE_USER_TIMESTAMP_KEY);
    }
  }
};

// Kills cache
export const clearUserCache = (): void => {
  // In-memory cache cleanup
  cachedUser = null;
  cacheTimestamp = null;

  // Local storage cleanup
  if (typeof window !== "undefined") {
    localStorage.removeItem(CACHED_USER_KEY);
    localStorage.removeItem(CACHE_USER_TIMESTAMP_KEY);
  }
};

// Save user to localStorage
const saveToLocalStorage = (user: User) => {
  if (typeof window === "undefined") return;
  setUserCache(user);
};

const refreshUserAccess = async (uid: string): Promise<string | null> => {
  const userAccessDoc = await getDoc(doc(db, "users", uid));
  if (!userAccessDoc.exists()) {
    clearUserCache();
    return null;
  }

  const accessLevel = userAccessDoc.get("access") as string;
  if (cachedUser && cachedUser.uid === uid) {
    setUserCache({ ...cachedUser, access: accessLevel as User["access"] });
  } else {
    setCacheTimestamp(Date.now());
  }
  return accessLevel;
};

// Fetch only user access from Firestore
export const getUserAccess = async (): Promise<string | null> => {
  // Checks if there is a cached user and if it's still valid
  if (!cachedUser) {
    loadFromLocalStorage();
  }

  // If we have a cached user and it's still valid, return it
  if (cachedUser && isCacheValid() && !shouldRevalidateAccess()) {
    return cachedUser.access;
  }

  // Otherwise, grab it from Firestore
  const user = auth.currentUser;
  if (user) {
    return refreshUserAccess(user.uid);
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
    });
  }
  return provider;
};
export const getUser = async (): Promise<User | null> => {
  // Checks if there is a cached user and if it's still valid
  if (!cachedUser) {
    loadFromLocalStorage();
  }

  // If we have a cached user and it's still valid, return it
  if (cachedUser && isCacheValid()) {
    const currentUser = auth.currentUser;
    if (
      currentUser &&
      currentUser.uid === cachedUser.uid &&
      shouldRevalidateAccess()
    ) {
      const refreshedAccess = await refreshUserAccess(currentUser.uid);
      if (refreshedAccess) {
        return cachedUser;
      }
    }
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
                displayName:
                  userData.displayName ?? firebaseUser.displayName ?? "",
                email: userData.email ?? firebaseUser.email ?? "",
                photoURL:
                  userData.photoURL ?? firebaseUser.photoURL ?? undefined,
                access: userData.access ?? "user",
                createdWith: userData.createdWith ?? getUserAuthProvider(),
                createdAt: userData.createdAt ?? new Date(0),
                lastFrqResponseAt: userData.lastFrqResponseAt,
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
  newRole: "member" | "grader" | "user" | "banned",
): Promise<void> => {
  if (!authUser || authUser.access !== "admin") {
    console.error("Unauthorized role change attempted.");
    return;
  }

  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No authenticated user found.");
    }

    const token = await currentUser.getIdToken();
    const response = await fetch(`/api/admin/users/${uid}/role`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ newRole }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      throw new Error(payload?.error ?? "Failed to update user role.");
    }
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
};
