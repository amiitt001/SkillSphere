import { NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
// Import initialized app to ensure it runs
import './firebaseAdmin';

export interface DecodedIdToken {
  uid: string;
  email?: string;
  [key: string]: any;
}

/**
 * Verifies the authorization header and returns the decoded Firebase ID token.
 * @param req The incoming NextRequest
 * @returns An object containing the user token or an error message and status code.
 */
export async function verifyAuth(req: NextRequest): Promise<{ user?: DecodedIdToken; error?: string; status?: number }> {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'Unauthorized: Missing or invalid token format', status: 401 };
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify using Firebase Admin SDK
    const decodedToken = await getAuth().verifyIdToken(token);
    return { user: decodedToken };
  } catch (error: any) {
    console.error('Firebase Auth verification failed:', error.message || error);
    return { error: 'Unauthorized: Invalid authentication token', status: 401 };
  }
}
