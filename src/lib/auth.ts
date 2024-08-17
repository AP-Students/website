// src/lib/auth.ts
import { auth } from './firebase';
import { GoogleAuthProvider, signInWithPopup, OAuthProvider } from 'firebase/auth';
import { useRouter } from 'next/router';

export const useAuthHandlers = () => {
  const router = useRouter();

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();

    try {
      await signInWithPopup(auth, provider);
      router.push('/');  
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  const signInWithDiscord = async () => {
    const provider = new OAuthProvider('discord.com');

    try {
      await signInWithPopup(auth, provider);
      router.push('/');  
    } catch (error) {
      console.error('Error signing in with Discord:', error);
    }
  };

  return { signInWithGoogle, signInWithDiscord };
};
