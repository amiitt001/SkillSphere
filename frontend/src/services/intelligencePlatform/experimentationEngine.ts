import { db } from '@/lib/firebase';
import { collection, doc, getDocs, setDoc, getDoc } from 'firebase/firestore';
import type { AbExperiment } from './types';

export const DEFAULT_EXPERIMENTS: AbExperiment[] = [
  { id: 'prompt_v1', name: 'Prompt Version A (Short) vs Prompt Version B (Detailed)', treatment: 'A', metricGoal: 'Acceptance Rate', conversionsCount: 12, participantsCount: 30, active: true },
  { id: 'layout_v1', name: 'Dashboard Layout A (Standard) vs Layout B (Compact)', treatment: 'B', metricGoal: 'Interaction Ratio', conversionsCount: 8, participantsCount: 24, active: true }
];

/**
 * Retrieves all experiments from Firestore. Seeds defaults if empty.
 */
export async function getAbExperiments(): Promise<AbExperiment[]> {
  try {
    const querySnap = await getDocs(collection(db, 'experiments'));
    if (querySnap.empty) {
      for (const exp of DEFAULT_EXPERIMENTS) {
        await setDoc(doc(db, 'experiments', exp.id), exp);
      }
      return DEFAULT_EXPERIMENTS;
    }
    return querySnap.docs.map(doc => doc.data() as AbExperiment);
  } catch (error) {
    console.error('[Experiment Engine] Error loading experiments:', error);
    return DEFAULT_EXPERIMENTS;
  }
}

/**
 * Assigns a user deterministically to A or B segment for an experiment.
 */
export function getTreatmentBucket(uid: string, experimentId: string): 'A' | 'B' {
  let hash = 0;
  const key = `${uid}_${experimentId}`;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % 2) === 0 ? 'A' : 'B';
}

/**
 * Triggers a conversion event for a user's assigned experiment segment.
 */
export async function logExperimentConversion(
  uid: string,
  experimentId: string
): Promise<void> {
  try {
    const expRef = doc(db, 'experiments', experimentId);
    const snap = await getDoc(expRef);
    if (snap.exists()) {
      const exp = snap.data() as AbExperiment;
      
      // Increment conversions and participants counts
      const updatedExp = {
        ...exp,
        conversionsCount: exp.conversionsCount + 1,
        participantsCount: exp.participantsCount + 1
      };
      
      await setDoc(expRef, updatedExp, { merge: true });
    }
  } catch (error) {
    console.error(`[Experiment Engine] Error conversion logging for ${experimentId}:`, error);
  }
}
