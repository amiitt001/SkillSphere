import type { ConnectedAccount } from './types';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export const INTEGRATION_MARKETPLACE: ConnectedAccount[] = [
  { id: 'github', name: 'GitHub Developer', category: 'coding', connected: false, healthStatus: 'disconnected' },
  { id: 'leetcode', name: 'LeetCode Stats', category: 'coding', connected: false, healthStatus: 'disconnected' },
  { id: 'google_calendar', name: 'Google Calendar Sync', category: 'productivity', connected: false, healthStatus: 'disconnected' },
  { id: 'coursera', name: 'Coursera credentials', category: 'learning', connected: false, healthStatus: 'disconnected' },
  { id: 'notion', name: 'Notion Workspace API', category: 'productivity', connected: false, healthStatus: 'disconnected' }
];

/**
 * Loads the health states and connection status of all marketplace connectors for the user.
 */
export async function getConnectedAccounts(uid: string): Promise<ConnectedAccount[]> {
  try {
    const credsSnap = await getDocs(collection(db, 'users', uid, 'credentials'));
    const connectedIds = credsSnap.docs.map(doc => doc.id);

    return INTEGRATION_MARKETPLACE.map(item => {
      const isConnected = connectedIds.includes(item.id);
      return {
        ...item,
        connected: isConnected,
        healthStatus: isConnected ? 'healthy' : 'disconnected',
        lastSyncedAt: isConnected ? new Date().toISOString() : undefined
      };
    });
  } catch (error) {
    console.error('[Integration Registry] Error loading accounts:', error);
    return INTEGRATION_MARKETPLACE;
  }
}
