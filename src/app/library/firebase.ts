import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCY86jDmDSzgWGwTnCAzIGmfOPfltn3rb8",
  authDomain: "ap-students-793df.firebaseapp.com",
  projectId: "ap-students-793df",
  storageBucket: "ap-students-793df.appspot.com",
  messagingSenderId: "263201885405",
  appId: "1:263201885405:web:6f1af85788f5ce0ceedf34",
  measurementId: "G-LN4PCYLCB6",
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export { db };

export default app;