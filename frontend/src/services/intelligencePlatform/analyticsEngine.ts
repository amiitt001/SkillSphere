import { db } from '@/lib/firebase';
import { collection, doc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import type { UserTelemetryEvent } from './types';

/**
 * Logs a product telemetry action for a user.
 */
export async function logTelemetryEvent(
  uid: string,
  action: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const eventId = `tel_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const event: UserTelemetryEvent = {
      id: eventId,
      action,
      metadata,
      timestamp: new Date().toISOString()
    };

    // Save to user subcollection
    const userTelRef = doc(db, 'users', uid, 'telemetry', eventId);
    await setDoc(userTelRef, {
      ...event,
      serverTime: serverTimestamp()
    });

    // Save to global audit log for Admin dashboard views
    const globalTelRef = doc(db, 'telemetry_global', eventId);
    await setDoc(globalTelRef, {
      userId: uid,
      ...event,
      serverTime: serverTimestamp()
    });
  } catch (error) {
    console.error('[Analytics Engine] Error saving telemetry event:', error);
  }
}

/**
 * Returns user telemetry logs. If uid is omitted, returns global telemetry.
 */
export async function getTelemetryEvents(uid?: string): Promise<UserTelemetryEvent[]> {
  try {
    const collectionRef = uid 
      ? collection(db, 'users', uid, 'telemetry')
      : collection(db, 'telemetry_global');

    const snap = await getDocs(collectionRef);
    const list = snap.docs.map(doc => doc.data() as UserTelemetryEvent);
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error('[Analytics Engine] Error fetching telemetry list:', error);
    return [];
  }
}
