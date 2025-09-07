import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyARWDPdvilNxs2aNN1_EhsQo0lxr4Q5A14",
  authDomain: "skillsphere-app.firebaseapp.com",
  projectId: "skillsphere-app",
  storageBucket: "skillsphere-app.firebasestorage.app",
  messagingSenderId: "248590277730",
  appId: "1:248590277730:web:a03aab5a250f21ff85c53b",
  measurementId: "G-24MCVJGH7M"
};

// Initialize Firebase for SSR
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

