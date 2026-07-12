import { getFirestore } from 'firebase-admin/firestore';
import './firebaseAdmin';

let db: any;
let docRef: any;

function getDocRef() {
  if (!docRef) {
    try {
      db = getFirestore();
      docRef = db.collection('system').doc('api_limits');
    } catch (e) {
      console.error("Failed to initialize Firestore Admin client in apiManager:", e);
    }
  }
  return docRef;
}

interface LimitStatus {
  geminiBlockedUntil?: string;
  nvidiaBlockedUntil?: string;
}

async function getLimitStatus(): Promise<LimitStatus> {
  try {
    const ref = getDocRef();
    if (ref) {
      const docSnap = await ref.get();
      if (docSnap.exists) {
        return docSnap.data() as LimitStatus;
      }
    }
  } catch (e) {
    console.error("Error reading limit status from Firestore:", e);
  }
  return {};
}

async function saveLimitStatus(status: LimitStatus) {
  try {
    const ref = getDocRef();
    if (ref) {
      await ref.set(status, { merge: true });
    }
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
