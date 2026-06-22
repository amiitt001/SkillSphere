/**
 * This file contains the core Firebase Admin SDK initialization for the SERVER-SIDE.
 * It uses the Base64 encoded service account for secure initialization.
 */
import { getApps, initializeApp, cert, getApp } from 'firebase-admin/app';

let adminApp: any;

// Check if the app is already initialized to prevent errors
if (!getApps().length) {
  try {
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

    if (!serviceAccountBase64) {
      throw new Error('Firebase service account (BASE64) is not set in environment variables.');
    }

    // Decode the Base64 string to get the raw JSON string
    const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
    
    const serviceAccount = JSON.parse(serviceAccountJson);

    // Initialize the Firebase Admin SDK
    adminApp = initializeApp({
      credential: cert(serviceAccount)
    });

  } catch (error) {
    console.error("CRITICAL ERROR: Initializing Firebase Admin SDK failed!", error);
  }
} else {
  adminApp = getApp();
}

// Export a compatible legacy default export containing the initialized app
const admin = {
  apps: getApps(),
  initializeApp: (options: any) => initializeApp(options),
  app: (name?: string) => getApp(name),
};

export default admin;
