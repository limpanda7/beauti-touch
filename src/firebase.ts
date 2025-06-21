// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD66GSHtReTHW2QwHfm8BlSlEZdvNuh7gc",
  authDomain: "beautitouch.firebaseapp.com",
  projectId: "beautitouch",
  storageBucket: "beautitouch.firebasestorage.app",
  messagingSenderId: "1072682333442",
  appId: "1:1072682333442:web:fea1d15b2ff5d7f11efe1b",
  measurementId: "G-XR27TQ6WWW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);