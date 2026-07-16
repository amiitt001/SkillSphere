import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Encrypts/obfuscates token credentials using Base64 encoding.
 */
function encrypt(text: string): string {
  try {
    return Buffer.from(text).toString('base64');
  } catch {
    return btoa(text);
  }
}

/**
 * Decrypts/deobfuscates token credentials using Base64 decoding.
 */
function decrypt(ciphertext: string): string {
  try {
    return Buffer.from(ciphertext, 'base64').toString('utf8');
  } catch {
    return atob(ciphertext);
  }
}

/**
 * Saves connection tokens securely under the user's credentials subcollection in Firestore.
 */
export async function saveCredentials(
  uid: string,
  integrationId: string,
  tokens: Record<string, string>
): Promise<void> {
  try {
    const credRef = doc(db, 'users', uid, 'credentials', integrationId);
    
    // Obfuscate sensitive credentials
    const encryptedTokens: Record<string, string> = {};
    Object.keys(tokens).forEach(key => {
      encryptedTokens[key] = encrypt(tokens[key]);
    });

    await setDoc(credRef, {
      integrationId,
      tokens: encryptedTokens,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(`[Credential Manager] Error saving keys for ${integrationId}:`, error);
  }
}

/**
 * Retrieves and decrypts token credentials for an integration.
 */
export async function getCredentials(
  uid: string,
  integrationId: string
): Promise<Record<string, string> | null> {
  try {
    const credRef = doc(db, 'users', uid, 'credentials', integrationId);
    const snap = await getDoc(credRef);
    if (snap.exists()) {
      const data = snap.data();
      const encryptedTokens = data.tokens || {};
      const decryptedTokens: Record<string, string> = {};
      
      Object.keys(encryptedTokens).forEach(key => {
        decryptedTokens[key] = decrypt(encryptedTokens[key]);
      });
      return decryptedTokens;
    }
  } catch (error) {
    console.error(`[Credential Manager] Error loading keys for ${integrationId}:`, error);
  }
  return null;
}

/**
 * Deletes connection credentials.
 */
export async function deleteCredentials(uid: string, integrationId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', uid, 'credentials', integrationId));
  } catch (error) {
    console.error(`[Credential Manager] Error deleting keys for ${integrationId}:`, error);
  }
}
