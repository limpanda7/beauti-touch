// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCbCCCAbtFSclmRBvFthsdw2AA6tam7aRc",
  authDomain: "beauti-touch.firebaseapp.com",
  projectId: "beauti-touch",
  storageBucket: "beauti-touch.firebasestorage.app",
  messagingSenderId: "191998056918",
  appId: "1:191998056918:web:cf12c42fb2f5247a7fec77",
  measurementId: "G-RFFSZRHNGN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);