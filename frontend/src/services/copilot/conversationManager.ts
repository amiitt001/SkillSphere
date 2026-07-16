import { db } from '@/lib/firebase';
import { collection, doc, getDocs, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { ChatSession, ChatMessage, CopilotMode } from './types';

/**
 * Loads all conversation sessions for a user, sorted by most recently updated.
 */
export async function getUserSessions(uid: string): Promise<ChatSession[]> {
  try {
    const sessionsSnap = await getDocs(collection(db, 'users', uid, 'copilot_sessions'));
    const sessions = sessionsSnap.docs.map((doc) => ({
      sessionId: doc.id,
      ...doc.data()
    })) as ChatSession[];
    return sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (error) {
    console.error('[Conversation Manager] Error loading sessions:', error);
    return [];
  }
}

/**
 * Loads a single conversation session. If it does not exist, initializes it.
 */
export async function getOrCreateSession(
  uid: string,
  sessionId: string,
  mode: CopilotMode = 'General'
): Promise<ChatSession> {
  const sessionRef = doc(db, 'users', uid, 'copilot_sessions', sessionId);

  try {
    const snap = await getDoc(sessionRef);
    if (snap.exists()) {
      return {
        sessionId,
        ...snap.data()
      } as ChatSession;
    }
  } catch (error) {
    console.error('[Conversation Manager] Error fetching session:', error);
  }

  // Create new session
  const newSession: ChatSession = {
    sessionId,
    mode,
    messages: [],
    updatedAt: new Date().toISOString()
  };

  try {
    await setDoc(sessionRef, {
      ...newSession,
      serverTime: serverTimestamp()
    });
  } catch (error) {
    console.error('[Conversation Manager] Error creating session:', error);
  }

  return newSession;
}

/**
 * Appends messages to a conversation session and updates the record in Firestore.
 */
export async function saveSessionMessages(
  uid: string,
  sessionId: string,
  messages: ChatMessage[],
  mode?: CopilotMode
): Promise<void> {
  try {
    const sessionRef = doc(db, 'users', uid, 'copilot_sessions', sessionId);
    const updateData: any = {
      messages,
      updatedAt: new Date().toISOString(),
      serverTime: serverTimestamp()
    };
    if (mode) {
      updateData.mode = mode;
    }

    await setDoc(sessionRef, updateData, { merge: true });
  } catch (error) {
    console.error('[Conversation Manager] Error saving messages:', error);
  }
}
