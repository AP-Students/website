import React, { createContext, useState, useEffect, useContext } from "react";
import { getUser } from "./users";
import { User } from "@/types/user";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedUser = await getUser();
      if(fetchedUser) {
        setUser(fetchedUser);
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          setLoading(true);
          setError(null);
          const fetchedUser = await getUser();
          if (fetchedUser) {
            setUser(fetchedUser);
          } else {
            setError("User data not found.");
            setUser(null);
          }
        } catch (err) {
          setError("Error fetching user.");
          setUser(null);
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if(loading){
    return <div className="flex min-h-screen items-center justify-center text-3xl">Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center text-3xl">
        {error}
      </div>
    );
  }

  return (
    <UserContext.Provider value={{ user, loading, error, setError }}>
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
