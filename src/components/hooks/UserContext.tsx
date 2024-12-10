import React, { createContext, useState, useEffect, useContext } from "react";
import { getUser } from "./users";
import type { User } from "@/types/user";

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
      if (fetchedUser) {
        setUser(fetchedUser);
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser().catch((error) => {
      console.error("Error fetching user:", error);
      setLoading(false);
    });
  }, []);

  const updateUser = async () => {
    await fetchUser();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-3xl">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center text-3xl">
        {error}
      </div>
    );
  }

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
