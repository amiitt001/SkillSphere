import { aiService } from '../ai/aiService';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import type { CalendarEvent } from './types';

const DEFAULT_PREP = [
  'Verify system design concepts on caching layers and database keys mapping indices.',
  'Check dockercompose networking port settings.',
  'Solve 1 LeetCode medium questions on arrays/linked lists.',
  'Revise core resume project details highlights.'
];

/**
 * Loads calendar events for a user from Firestore.
 */
export async function getUserCalendarEvents(uid: string): Promise<CalendarEvent[]> {
  try {
    const querySnap = await getDocs(collection(db, 'users', uid, 'calendar_events'));
    return querySnap.docs.map(doc => doc.data() as CalendarEvent);
  } catch (error) {
    console.error('[Calendar Intelligence] Error loading events:', error);
    return [];
  }
}

/**
 * Analyzes a calendar event and generates a tailored AI preparation checklist.
 */
export async function generateEventPrepChecklist(
  uid: string,
  event: CalendarEvent
): Promise<string[]> {
  const prompt = `
You are the SkillSphere Calendar Intelligence planner. Analyze this upcoming event:
Title: "${event.title}"
Type: "${event.type}"
Date/Time: "${event.dateTime}"
Description: "${event.description}"

Generate 4 progressive preparation action items to revise.
Output a JSON response that maps EXACTLY to the following schema. Do not add markdown:
{
  "checklist": ["action 1", "action 2", "action 3", "action 4"]
}
`;

  let checklist = DEFAULT_PREP;

  try {
    const res = await aiService.generateJSON(
      prompt,
      { checklist: DEFAULT_PREP },
      'You are a preparation checklist planner. Output strictly valid JSON matching the requested structure.'
    );
    checklist = res.data.checklist;
  } catch (error) {
    console.error('[Calendar Intelligence] Error compiling AI checklist:', error);
  }

  // Update the event doc in DB with the checklist
  try {
    await setDoc(doc(db, 'users', uid, 'calendar_events', event.id), {
      ...event,
      aiPrepChecklist: checklist
    }, { merge: true });
  } catch (error) {
    console.error('[Calendar Intelligence] Error saving event checklist:', error);
  }

  return checklist;
}
