import { db } from '@/lib/firebase';
import { collection, doc, getDocs, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getCredentials } from './credentialManager';
import { getConnectedAccounts } from './integrationRegistry';
import { fetchRemoteIntegrationData } from './connectorEngine';
import { triggerIntegrationWorkflows } from './automationEngine';
import type { SyncLog } from './types';

/**
 * Triggers a manual or scheduled synchronization run across all connected integrations.
 */
export async function executeIntegrationSync(uid: string): Promise<SyncLog[]> {
  const syncLogs: SyncLog[] = [];
  const accounts = await getConnectedAccounts(uid);
  const connectedAccounts = accounts.filter(a => a.connected);

  if (connectedAccounts.length === 0) {
    return [];
  }

  // Fetch student profile doc to merge changes
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  let userData = userSnap.exists() ? userSnap.data() : null;

  for (const account of connectedAccounts) {
    const logId = `sync_${account.id}_${Date.now()}`;
    let status: 'success' | 'error' = 'success';
    let message = `Successfully synchronized ${account.name} records.`;

    try {
      const credentials = await getCredentials(uid, account.id);
      if (!credentials) {
        throw new Error('Missing integration tokens');
      }

      // Fetch simulated records
      const remoteData = await fetchRemoteIntegrationData(account.id, credentials);

      // Perform profile update merges
      if (userData && userData.unifiedProfile) {
        const profile = { ...userData.unifiedProfile };
        let updated = false;

        if (account.id === 'github' && remoteData.commitsCount) {
          profile.totalRepositories = (profile.totalRepositories || 0) + remoteData.repositoriesUpdated;
          updated = true;
        } else if (account.id === 'leetcode' && remoteData.problemsSolvedDelta) {
          profile.codingProblemsSolved = (profile.codingProblemsSolved || 0) + remoteData.problemsSolvedDelta;
          updated = true;
        } else if (account.id === 'coursera' && remoteData.completedCourses) {
          profile.certifications = Array.from(new Set([...(profile.certifications || []), ...remoteData.completedCourses]));
          updated = true;
        }

        if (updated) {
          await setDoc(userRef, { unifiedProfile: profile }, { merge: true });
        }
      }

      // Save Google Calendar events in db if needed
      if (account.id === 'google_calendar' && remoteData.events) {
        for (const evt of remoteData.events) {
          await setDoc(doc(db, 'users', uid, 'calendar_events', evt.id), evt);
        }
      }

      // Trigger matching workflow rules
      await triggerIntegrationWorkflows(uid, account.id, remoteData);

    } catch (error: any) {
      status = 'error';
      message = `Synchronization failed: ${error.message || error}`;
    }

    const logEntry: SyncLog = {
      id: logId,
      integrationId: account.id,
      status,
      message,
      timestamp: new Date().toISOString()
    };

    // Save sync audit log
    try {
      await setDoc(doc(db, 'users', uid, 'sync_logs', logId), {
        ...logEntry,
        serverTime: serverTimestamp()
      });
      syncLogs.push(logEntry);
    } catch (err) {
      console.error('[Sync Engine] Error saving sync log:', err);
    }
  }

  return syncLogs;
}

/**
 * Loads recent sync audit logs for a user.
 */
export async function getSyncLogs(uid: string): Promise<SyncLog[]> {
  try {
    const querySnap = await getDocs(collection(db, 'users', uid, 'sync_logs'));
    const logs = querySnap.docs.map(doc => doc.data() as SyncLog);
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error('[Sync Engine] Error fetching sync logs:', error);
    return [];
  }
}
