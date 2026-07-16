import { db } from '@/lib/firebase';
import { collection, doc, getDocs, getDoc, setDoc } from 'firebase/firestore';
import type { FeatureFlag } from './types';

export const DEFAULT_FLAGS: FeatureFlag[] = [
  { id: 'enable_deepseek_cascade', name: 'Gradual deepseek cascades rollouts', enabled: true, rolloutPercentage: 100 },
  { id: 'enable_ai_gps', name: 'Autonomous career GPS panel', enabled: true, rolloutPercentage: 80 },
  { id: 'new_dashboard_theme', name: 'Glassmorphic warm themes designs', enabled: false, rolloutPercentage: 20 },
  { id: 'enable_campus_drives', name: 'B2B Placement campus drives features', enabled: true, rolloutPercentage: 100 }
];

/**
 * Retrieves all active feature flags. Seeds defaults if none are found in Firestore.
 */
export async function getFeatureFlags(): Promise<FeatureFlag[]> {
  try {
    const querySnap = await getDocs(collection(db, 'feature_flags'));
    if (querySnap.empty) {
      for (const flag of DEFAULT_FLAGS) {
        await setDoc(doc(db, 'feature_flags', flag.id), flag);
      }
      return DEFAULT_FLAGS;
    }
    return querySnap.docs.map(doc => doc.data() as FeatureFlag);
  } catch (error) {
    console.error('[Feature Flags] Error loading flags:', error);
    return DEFAULT_FLAGS;
  }
}

/**
 * Saves or updates a feature flag rule.
 */
export async function saveFeatureFlag(flag: FeatureFlag): Promise<void> {
  try {
    await setDoc(doc(db, 'feature_flags', flag.id), flag);
  } catch (error) {
    console.error('[Feature Flags] Error saving flag:', error);
  }
}

/**
 * Deterministically decides if a feature flag is enabled for a given user based on their user ID hash.
 */
export async function isFeatureEnabled(uid: string, flagId: string): Promise<boolean> {
  try {
    const flags = await getFeatureFlags();
    const flag = flags.find(f => f.id === flagId);
    if (!flag) return false;
    if (!flag.enabled) return false;

    // Simple hashing of uid to determine if user fits rollout percentage bucket
    let hash = 0;
    for (let i = 0; i < uid.length; i++) {
      hash = uid.charCodeAt(i) + ((hash << 5) - hash);
    }
    const userBucket = Math.abs(hash % 100);

    return userBucket < flag.rolloutPercentage;
  } catch (error) {
    console.error('[Feature Flags] Error checking status:', error);
    return false;
  }
}
