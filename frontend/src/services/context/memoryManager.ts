import { getFirestore } from 'firebase-admin/firestore';
import '@/lib/firebaseAdmin';
import { logger } from '@/services/logger';

function getAdminDb() {
  return getFirestore();
}

export const memoryManager = {
  /**
   * Retrieves memory layer data for the given user.
   */
  async getMemory(uid: string, layer: 'long_term' | 'conversation' | 'working' | 'reflection'): Promise<any> {
    try {
      const db = getAdminDb();
      const snap = await db.collection('users').doc(uid).collection('memory').doc(layer).get();
      if (snap.exists) {
        return snap.data() || {};
      }
      return {};
    } catch (error) {
      logger.error(`[MemoryManager] Failed to read memory layer ${layer} for user ${uid}:`, error);
      return {};
    }
  },

  /**
   * Updates or saves memory layer data.
   */
  async setMemory(uid: string, layer: 'long_term' | 'conversation' | 'working' | 'reflection', data: Record<string, any>): Promise<void> {
    try {
      const db = getAdminDb();
      await db.collection('users').doc(uid).collection('memory').doc(layer).set({
        ...data,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      logger.error(`[MemoryManager] Failed to write memory layer ${layer} for user ${uid}:`, error);
      throw error;
    }
  }
};

export default memoryManager;
