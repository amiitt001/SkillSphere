import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { CareerHealthScore } from './types';

const DEFAULT_HEALTH: CareerHealthScore = {
  overall: 78,
  factors: {
    consistency: 80,
    projects: 85,
    learning: 70,
    coding: 75,
    resume: 80
  },
  trendHistory: [
    { date: '1 Week Ago', score: 72 },
    { date: '4 Days Ago', score: 75 },
    { date: 'Today', score: 78 }
  ],
  updatedAt: new Date().toISOString()
};

/**
 * Calculates a multi-factor Career Health Score and saves the details in Firestore.
 */
export async function trackCareerHealth(uid: string): Promise<CareerHealthScore> {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data();
      const profile = data.unifiedProfile;
      const score = data.profileScore;

      let coding = 60;
      let projects = 65;
      let learning = 55;
      let resume = 70;
      let consistency = 75;

      if (score) {
        coding = score.dsa || 60;
        projects = score.learning || 65;
        resume = score.github || 70;
      }

      if (profile) {
        const repoCount = profile.totalRepositories || 0;
        projects = Math.min(100, 50 + repoCount * 6);

        const problemsSolved = profile.codingProblemsSolved || 0;
        coding = Math.min(100, 40 + Math.round((problemsSolved / 150) * 60));

        const certsCount = (profile.certifications || []).length;
        learning = Math.min(100, 50 + certsCount * 10);
      }

      const overall = Math.round((consistency + projects + learning + coding + resume) / 5);

      const healthDocRef = doc(db, 'users', uid, 'career_health', 'current');
      const healthSnap = await getDoc(healthDocRef);

      let history = [...DEFAULT_HEALTH.trendHistory];
      if (healthSnap.exists()) {
        const healthData = healthSnap.data() as CareerHealthScore;
        if (Array.isArray(healthData.trendHistory)) {
          history = [...healthData.trendHistory];
        }
      }

      // Add a fresh coordinate if today's date doesn't exist
      const todayLabel = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!history.some(h => h.date === todayLabel)) {
        history.push({ date: todayLabel, score: overall });
      }
      if (history.length > 5) history.shift(); // keep last 5 points

      const updatedHealth: CareerHealthScore = {
        overall,
        factors: { consistency, projects, learning, coding, resume },
        trendHistory: history,
        updatedAt: new Date().toISOString()
      };

      await setDoc(healthDocRef, {
        ...updatedHealth,
        serverTime: serverTimestamp()
      });

      return updatedHealth;
    }
  } catch (error) {
    console.error('[Monitoring Engine] Error tracking career health:', error);
  }

  return DEFAULT_HEALTH;
}
