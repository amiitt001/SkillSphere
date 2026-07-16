import { getFirestore } from 'firebase-admin/firestore';
import '@/lib/firebaseAdmin';
import { ProfileEvent, ProfileEventType } from '@/types/profile';
import { eventBus } from '../events/eventBus';
import { logger } from '@/services/logger';

function getAdminDb() {
  return getFirestore();
}

export const eventStore = {
  /**
   * Appends an immutable event for a user aggregate, increments versioning, and publishes to the system-wide Event Bus.
   */
  async appendEvent(
    uid: string,
    eventType: ProfileEventType,
    payload: Record<string, any>,
    actor = 'system'
  ): Promise<ProfileEvent> {
    try {
      const db = getAdminDb();
      const eventsCollection = db.collection('users').doc(uid).collection('events');

      // Fetch the last event version number to ensure sequence integrity
      const lastEvents = await eventsCollection
        .orderBy('version', 'desc')
        .limit(1)
        .get();

      let nextVersion = 1;
      if (!lastEvents.empty) {
        const lastEvent = lastEvents.docs[0].data();
        nextVersion = (lastEvent.version || 0) + 1;
      }

      const eventId = Math.random().toString(36).substring(2, 15);
      const newEvent: ProfileEvent = {
        eventId,
        eventType,
        aggregateId: uid,
        timestamp: new Date().toISOString(),
        payload,
        metadata: {
          actor,
        },
        version: nextVersion,
      };

      await eventsCollection.doc(eventId).set(newEvent);
      logger.info(`[EventStore] Appended event ${eventType} (v${nextVersion}) for user ${uid}`);

      // Publish the event system-wide
      eventBus.publish(eventType, newEvent);
      // Publish general profile updated event
      eventBus.publish('profile:updated', newEvent);

      return newEvent;
    } catch (error) {
      logger.error(`[EventStore] Failed to append event for user ${uid}:`, error);
      throw error;
    }
  },

  /**
   * Retrieves all historical events for a user aggregate, ordered chronologically.
   */
  async getEvents(uid: string): Promise<ProfileEvent[]> {
    try {
      const db = getAdminDb();
      const snap = await db
        .collection('users')
        .doc(uid)
        .collection('events')
        .orderBy('version', 'asc')
        .get();

      const events: ProfileEvent[] = [];
      snap.forEach((doc) => {
        events.push(doc.data() as ProfileEvent);
      });
      return events;
    } catch (error) {
      logger.error(`[EventStore] Failed to retrieve events for user ${uid}:`, error);
      throw error;
    }
  }
};

export default eventStore;
