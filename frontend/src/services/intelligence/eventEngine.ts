import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import type { EcosystemEvent, EcosystemEventType } from './types';
import { runAutomationWorkflow } from './automationEngine';

/**
 * Dispatches a career ecosystem event. Saves to Firestore and forwards to the Automation Engine.
 */
export async function dispatchCareerEvent(
  uid: string,
  type: EcosystemEventType,
  description: string,
  metadata?: Record<string, any>
): Promise<EcosystemEvent> {
  const eventId = `evt_${Math.random().toString(36).substring(7)}`;
  const newEvent: EcosystemEvent = {
    id: eventId,
    type,
    description,
    timestamp: new Date().toISOString(),
    metadata
  };

  try {
    // 1. Save to DB
    await setDoc(doc(db, 'users', uid, 'events', eventId), {
      ...newEvent,
      serverTime: serverTimestamp()
    });

    // 2. Trigger workflow automation rule matcher asynchronously
    await runAutomationWorkflow(uid, newEvent);

  } catch (error) {
    console.error('[Event Engine] Error logging career event:', error);
  }

  return newEvent;
}

/**
 * Retrieves the event history logs for a user.
 */
export async function getUserEvents(uid: string): Promise<EcosystemEvent[]> {
  try {
    const querySnap = await getDocs(collection(db, 'users', uid, 'events'));
    const events = querySnap.docs.map(doc => doc.data() as EcosystemEvent);
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error('[Event Engine] Error listing user events:', error);
    return [];
  }
}
