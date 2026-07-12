import { getFirestore } from 'firebase-admin/firestore';
import './firebaseAdmin';

const db = getFirestore();
const docRef = db.collection('system').doc('api_limits');

interface LimitStatus {
  geminiBlockedUntil?: string;
  nvidiaBlockedUntil?: string;
}

async function getLimitStatus(): Promise<LimitStatus> {
  try {
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      return docSnap.data() as LimitStatus;
    }
  } catch (e) {
    console.error("Error reading limit status from Firestore:", e);
  }
  return {};
}

async function saveLimitStatus(status: LimitStatus) {
  try {
    await docRef.set(status, { merge: true });
  } catch (e) {
    console.error("Error writing limit status to Firestore:", e);
  }
}

export async function isGeminiBlocked(): Promise<boolean> {
  const status = await getLimitStatus();
  if (status.geminiBlockedUntil) {
    const blockedUntil = new Date(status.geminiBlockedUntil);
    if (new Date() < blockedUntil) {
      return true;
    }
  }
  return false;
}

export async function isNvidiaBlocked(): Promise<boolean> {
  const status = await getLimitStatus();
  if (status.nvidiaBlockedUntil) {
    const blockedUntil = new Date(status.nvidiaBlockedUntil);
    if (new Date() < blockedUntil) {
      return true;
    }
  }
  return false;
}

export async function blockGemini() {
  const blockedUntil = new Date();
  blockedUntil.setHours(blockedUntil.getHours() + 24); // Block for 24 hours
  const blockTimeStr = blockedUntil.toISOString();
  await saveLimitStatus({ geminiBlockedUntil: blockTimeStr });
  console.log(`[API Manager] Google Gemini API has been blocked until ${blockTimeStr} due to rate limits.`);
}

export async function blockNvidia() {
  const blockedUntil = new Date();
  blockedUntil.setHours(blockedUntil.getHours() + 24); // Block for 24 hours
  const blockTimeStr = blockedUntil.toISOString();
  await saveLimitStatus({ nvidiaBlockedUntil: blockTimeStr });
  console.log(`[API Manager] NVIDIA DeepSeek API has been blocked until ${blockTimeStr} due to rate limits.`);
}
