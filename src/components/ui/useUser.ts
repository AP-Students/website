// src/hooks/useUser.ts
import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import { User } from '@/types/user';

export const useUser = (): User | null => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const idTokenResult = await firebaseUser.getIdTokenResult(); 
        const mappedUser: User = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || undefined,
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || undefined,
          admin: !!idTokenResult.claims.admin || false, 
        };
        setUser(mappedUser);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  return user;
};
