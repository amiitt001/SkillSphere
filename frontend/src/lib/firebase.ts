/**
 * This file contains the core Firebase initialization logic for the client-side application.
 * It is responsible for setting up the connection to your Firebase project using
 * secure environment variables.
 */
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- FIREBASE CONFIGURATION ---
// This configuration object is populated with environment variables.
// This is a secure practice that prevents your secret keys from being exposed in your source code.
// The 'NEXT_PUBLIC_' prefix is a Next.js convention to make these variables accessible in the browser.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// --- INITIALIZATION LOGIC ---
// This logic ensures that Firebase is only initialized once, preventing errors
// during hot-reloading in a development environment.
let app;
if (!getApps().length) {
  // If no Firebase app has been initialized yet, create a new one.
  app = initializeApp(firebaseConfig);
} else {
  // If an app already exists, get a reference to it.
  app = getApp();
}

// Get references to the specific Firebase services you will use in your application.
const auth = getAuth(app);
const db = getFirestore(app);

// Export the initialized services so they can be imported and used in other components.
export { app, auth, db };
