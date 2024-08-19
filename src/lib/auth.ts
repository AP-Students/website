// // src/lib/auth.ts
// import { auth } from './firebase';
// import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
// import { doc, setDoc, getDoc } from 'firebase/firestore';
// import { db } from './firebase'; // Firestore instance
// import { useRouter } from 'next/router';

// export const useAuthHandlers = () => {
//   const router = useRouter();

//   const signUpWithEmail = async (email: string, password: string) => {
//     try {
//       const userCredential = await createUserWithEmailAndPassword(auth, email, password);
//       const user = userCredential.user;

//       // After creating the user, store additional data in Firestore
//       const userDocRef = doc(db, 'users', user.uid);
//       await setDoc(userDocRef, {
//         uid: user.uid,
//         email: user.email,
//         displayName: user.displayName,
//         admin: false, // Default to non-admin; set this as needed
//       });

//       router.push('/dashboard');
//     } catch (error) {
//       console.error('Error signing up with email:', error);
//     }
//   };

//   const signInWithEmail = async (email: string, password: string) => {
//     try {
//       const userCredential = await signInWithEmailAndPassword(auth, email, password);
//       const user = userCredential.user;

//       // Check if user data exists in Firestore
//       const userDocRef = doc(db, 'users', user.uid);
//       const userDoc = await getDoc(userDocRef);

//       if (!userDoc.exists()) {
//         // If not, create it with default values
//         await setDoc(userDocRef, {
//           uid: user.uid,
//           email: user.email,
//           displayName: user.displayName,
//           admin: false, // Default to non-admin
//         });
//       }

//       router.push('/dashboard');
//     } catch (error) {
//       console.error('Error signing in with email:', error);
//     }
//   };

//   const signInWithGoogle = async () => {
//     const provider = new GoogleAuthProvider();

//     try {
//       const userCredential = await signInWithPopup(auth, provider);
//       const user = userCredential.user;

//       // Check if user data exists in Firestore
//       const userDocRef = doc(db, 'users', user.uid);
//       const userDoc = await getDoc(userDocRef);

//       if (!userDoc.exists()) {
//         // If not, create it with default values
//         await setDoc(userDocRef, {
//           uid: user.uid,
//           email: user.email,
//           displayName: user.displayName,
//           admin: false, // Default to non-admin
//         });
//       }

//       router.push('/dashboard');
//     } catch (error) {
//       console.error('Error signing in with Google:', error);
//     }
//   };

//   return { signUpWithEmail, signInWithEmail, signInWithGoogle };
// };














import { auth } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useRouter } from 'next/router';

export const useAuthHandlers = () => {
  const router = useRouter();

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();

    try {
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create a new user document in Firestore
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          admin: false, 
        });
      }

      router.push("/");
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };


  // In development, might not even use Discord. 
  const signInWithDiscord = async () => {
    const DISCORD_CLIENT_ID = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI;
    const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI!,
    )}&response_type=code&scope=identify email`;

    // Redirect to Discord's OAuth2 page
    window.location.href = url;
  };


  return { signInWithGoogle };
};
