import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import type { ComplianceAuditLog } from './types';

/**
 * Logs a compliance audit entry in Firestore.
 */
export async function logComplianceAudit(
  uid: string,
  actor: string,
  action: string,
  ipAddress: string = '127.0.0.1'
): Promise<void> {
  try {
    const logId = `aud_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const log: ComplianceAuditLog = {
      id: logId,
      actor,
      action,
      ipAddress,
      timestamp: new Date().toISOString()
    };

    // Save to user subcollection
    const userLogRef = doc(db, 'users', uid, 'compliance_audits', logId);
    await setDoc(userLogRef, {
      ...log,
      serverTime: serverTimestamp()
    });

    // Save to global audit log for platform administrators views
    const globalLogRef = doc(db, 'compliance_audits_global', logId);
    await setDoc(globalLogRef, {
      userId: uid,
      ...log,
      serverTime: serverTimestamp()
    });
  } catch (error) {
    console.error('[Compliance Engine] Error logging audit event:', error);
  }
}

/**
 * Returns compliance audits logs.
 */
export async function getComplianceAuditLogs(uid?: string): Promise<ComplianceAuditLog[]> {
  try {
    const collectionRef = uid 
      ? collection(db, 'users', uid, 'compliance_audits')
      : collection(db, 'compliance_audits_global');

    const snap = await getDocs(collectionRef);
    const list = snap.docs.map(doc => doc.data() as ComplianceAuditLog);
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error('[Compliance Engine] Error fetching audit logs:', error);
    return [];
  }
}

/**
 * Packages all student information for GDPR Data Portability download.
 */
export async function exportUserDataPackage(uid: string): Promise<Record<string, any>> {
  const profileSnap = await getDoc(doc(db, 'users', uid));
  const profile = profileSnap.exists() ? profileSnap.data() : {};

  // Retrieve sync logs, feedbacks, credentials keys details
  const [syncDocs, feedbackDocs, keysDocs] = await Promise.all([
    getDocs(collection(db, 'users', uid, 'sync_logs')),
    getDocs(collection(db, 'users', uid, 'ai_feedback')),
    getDocs(collection(db, 'users', uid, 'developer_keys'))
  ]);

  return {
    exportDate: new Date().toISOString(),
    profile,
    syncLogs: syncDocs.docs.map(d => d.data()),
    aiFeedback: feedbackDocs.docs.map(d => d.data()),
    developerKeys: keysDocs.docs.map(d => d.data())
  };
}

/**
 * Reset/Delete student data to respect GDPR Right To Be Forgotten compliance.
 */
export async function eraseUserDataRecord(uid: string): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await deleteDoc(userRef);
  // Logs audit event
  await logComplianceAudit(uid, 'System Scheduler', 'Erase User Account Record');
}
