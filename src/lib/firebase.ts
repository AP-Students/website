import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import dotenv from "dotenv";

dotenv.config();

console.log('API Key:', process.env.FIREBASE_API_KEY);


const firebaseConfig = {
  apiKey: "AIzaSyBSeZjbdoK8mPwnknS6C-V6Tg1UtUN39ZM",
  authDomain: "ap-students-32bbe.firebaseapp.com",
  projectId: "ap-students-32bbe",
  storageBucket: "ap-students-32bbe.appspot.com",
  messagingSenderId: "938772062823",
  appId: "1:938772062823:web:32f0b7460df2193e146ac2",
  measurementId: "G-MLXZEHB999"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
export default app;
