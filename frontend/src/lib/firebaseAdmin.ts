/**
 * This file contains the core Firebase Admin SDK initialization for the SERVER-SIDE.
 * It uses the Base64 encoded service account for secure initialization.
 */
import admin from 'firebase-admin';

// Check if the app is already initialized to prevent errors
if (!admin.apps.length) {
  try {
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

    if (!serviceAccountBase64) {
      throw new Error('Firebase service account (BASE64) is not set in environment variables.');
    }

    // Decode the Base64 string to get the raw JSON string
    const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
    
    const serviceAccount = JSON.parse(serviceAccountJson);

    // Initialize the Firebase Admin SDK
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

  } catch (error) {
    console.error("CRITICAL ERROR: Initializing Firebase Admin SDK failed!", error);
  }
}

// Export the initialized admin instance
export default admin;
