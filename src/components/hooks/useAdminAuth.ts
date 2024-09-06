import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const useAdminAuth = () => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        // Store token in cookies for middleware to access
        document.cookie = `firebaseToken=${token}; path=/`;
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        document.cookie = 'firebaseToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'; // Remove token
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { loading, isAuthenticated };
};

export default useAdminAuth;
