import { aiService } from '../ai/aiService';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { CareerReport } from './types';

const DEFAULT_REPORT: CareerReport = {
  id: 'rep_default',
  type: 'weekly',
  progressSummary: 'You maintained solid activity on systems engineering tasks this week. Successfully configured local docker settings and passed foundational assessment questions.',
  skillGrowth: ['Docker Compose systems configuration', 'Basic relational database schemas design'],
  goalsAchieved: ['Initialize microservices prototype', 'Add README guidelines to GitHub'],
  missedOpportunities: ['Did not push daily DSA solves consistently'],
  nextActions: ['Close critical Redis caching gaps', 'Verify REST API pagination algorithms'],
  createdAt: new Date().toISOString()
};

/**
 * Compiles a weekly/monthly Career Report and saves it to Firestore.
 */
export async function generateCareerReport(uid: string, type: 'weekly' | 'monthly'): Promise<CareerReport> {
  const reportId = `rep_${type}_${Date.now()}`;
  let contextString = 'No context logged.';

  try {
    const userSnap = await getDoc(doc(db, 'users', uid));
    if (userSnap.exists()) {
      const data = userSnap.data();
      contextString = `
User: ${data.name || 'Student'}
Ready Score: ${data.profileScore?.overall || 70}
Skills: ${(data.unifiedProfile?.skills || []).join(', ')}
Target Role: ${data.unifiedProfile?.linkedin?.currentRole || 'SDE'}
`;
    }
  } catch (error) {
    console.error('[Reports Engine] Error reading profile:', error);
  }

  const prompt = `
You are the SkillSphere Career Report Compiler. Create a detailed ${type} Progress Assessment Report.
User details:
${contextString}

Output a JSON response that maps EXACTLY to the following schema. Do not add markdown:
{
  "progressSummary": "A detailed multi-line summary paragraph assessing their work",
  "skillGrowth": ["improved skill A", "improved skill B"],
  "goalsAchieved": ["completed goal A", "completed goal B"],
  "missedOpportunities": ["stagnant area A"],
  "nextActions": ["recommended priority action A", "recommended priority action B"]
}
`;

  const fallback = {
    ...DEFAULT_REPORT,
    id: reportId,
    type,
    createdAt: new Date().toISOString()
  };

  let reportData = fallback;

  try {
    const res = await aiService.generateJSON<any>(
      prompt,
      fallback,
      'You are a career reports writer. Output strictly valid JSON matching the requested structure.'
    );
    reportData = {
      id: reportId,
      type,
      ...res.data,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('[Reports Engine] AI compilation failed:', error);
  }

  // Save report to Firestore
  try {
    await setDoc(doc(db, 'users', uid, 'reports', reportId), reportData);
  } catch (error) {
    console.error('[Reports Engine] Error saving report to DB:', error);
  }

  return reportData;
}
