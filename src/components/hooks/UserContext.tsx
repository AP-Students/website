import React, { createContext, useState, useEffect, useContext } from "react";
import { getUser } from "./users";
import type { User } from "@/types/user";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  updateUser: () => Promise<void>; // New method to force a user state update
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// We need to cache this...
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedUser = await getUser();
      setUser(fetchedUser);
      setLoading(false);
    } catch (err) {
      setUser(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      void fetchUser();
    });

    fetchUser().catch((error) => {
      console.error("Error fetching user:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateUser = async () => {
    await fetchUser();
  };

  // Always render children: this provider wraps the whole app, so gating on the
  // client-only `loading`/`error` state (which is `loading === true` during SSR)
  // strips every page's content and JSON-LD out of the static HTML. Consumers
  // read `loading`/`user` from context and handle their own pending/auth state.
  return (
    <UserContext.Provider
      value={{ user, loading, error, setError, setLoading, updateUser }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);

  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
