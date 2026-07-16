import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { CopilotMemory } from './types';

const DEFAULT_MEMORY: CopilotMemory = {
  careerGoals: [],
  preferredTech: [],
  completedProjects: [],
  learningPreferences: ['Video tutorials', 'Hands-on coding challenges'],
  conversationSummaries: []
};

/**
 * Retrieves the user's persistent long-term memory from Firestore.
 */
export async function getUserMemory(uid: string): Promise<CopilotMemory> {
  try {
    const memoryDocRef = doc(db, 'users', uid, 'copilot_memory', 'profile');
    const snap = await getDoc(memoryDocRef);
    if (snap.exists()) {
      return {
        ...DEFAULT_MEMORY,
        ...snap.data()
      } as CopilotMemory;
    }
  } catch (error) {
    console.error('[Memory Engine] Error loading memory:', error);
  }
  return DEFAULT_MEMORY;
}

/**
 * Saves or merges the user's persistent long-term memory in Firestore.
 */
export async function saveUserMemory(uid: string, memory: Partial<CopilotMemory>): Promise<void> {
  try {
    const memoryDocRef = doc(db, 'users', uid, 'copilot_memory', 'profile');
    await setDoc(memoryDocRef, {
      ...memory,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('[Memory Engine] Error saving memory:', error);
  }
}

/**
 * Appends a conversation summary block to the long-term memory log.
 */
export async function updateMemoryFromChat(uid: string, newSessionSummary: string): Promise<void> {
  try {
    const memory = await getUserMemory(uid);
    const updatedSummaries = [...memory.conversationSummaries, newSessionSummary].slice(-5); // keep last 5 summaries
    await saveUserMemory(uid, { conversationSummaries: updatedSummaries });
  } catch (error) {
    console.error('[Memory Engine] Error updating chat summaries memory:', error);
  }
}
