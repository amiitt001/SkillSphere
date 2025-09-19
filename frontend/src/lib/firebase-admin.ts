// In frontend/src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

// This prevents re-initializing the app on every hot reload in development
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        // Vercel escapes newlines, so we need to replace them back
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

// Export the admin database instance
export const db = admin.firestore();