import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import type { AiFeedback } from './types';

/**
 * Saves a structured user AI feedback rating item in Firestore.
 */
export async function saveAiFeedback(uid: string, feedback: AiFeedback): Promise<void> {
  try {
    const feedbackDocRef = doc(db, 'users', uid, 'ai_feedback', feedback.id);
    await setDoc(feedbackDocRef, {
      ...feedback,
      serverTime: serverTimestamp()
    });

    // Pushes global log for admin views
    const globalLogRef = doc(db, 'ai_feedback_global', feedback.id);
    await setDoc(globalLogRef, {
      userId: uid,
      ...feedback,
      serverTime: serverTimestamp()
    });
  } catch (error) {
    console.error('[Feedback Engine] Error logging feedback:', error);
  }
}

/**
 * Retrieves the user's feedback histories. If uid is omitted, retrieves all global feedback (admin view).
 */
export async function getAiFeedbackList(uid?: string): Promise<AiFeedback[]> {
  try {
    const collectionRef = uid 
      ? collection(db, 'users', uid, 'ai_feedback')
      : collection(db, 'ai_feedback_global');

    const querySnap = await getDocs(collectionRef);
    const list = querySnap.docs.map(doc => doc.data() as AiFeedback);
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error('[Feedback Engine] Error loading feedback logs:', error);
    return [];
  }
}
