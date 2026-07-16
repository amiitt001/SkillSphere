import { aiService } from '../ai/aiService';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface AutonomousCoachBrief {
  todayPriorities: string[];
  recommendedCodingProblem: string;
  recommendedLearningModule: string;
  recommendedProjectTask: string;
  recommendedCertification: string;
  recommendedApplication: string;
  careerHealthSummary: string;
  expectedScoreImprovement: string;
}

const DEFAULT_COACH_BRIEF: AutonomousCoachBrief = {
  todayPriorities: [
    'Refactor e-commerce API server docker configuration routes.',
    'Review LRU cache eviction complexity calculations.'
  ],
  recommendedCodingProblem: 'LeetCode #146: LRU Cache (Medium difficulty). Focus on double linked list indexing.',
  recommendedLearningModule: 'System Design Course section 3: Distributed database write topologies.',
  recommendedProjectTask: 'Create a local compose script mapping ports to verify network requests.',
  recommendedCertification: 'AWS Certified Cloud Practitioner (Module 2: Virtual private cloud configurations).',
  recommendedApplication: 'Google India Software Engineering Intern (92% profile compatibility score).',
  careerHealthSummary: 'Your Consistency rating remains strong. Solving the recommended cache challenges will raise your DSA rating by 4 points.',
  expectedScoreImprovement: '+5 points to Career Readiness Index'
};

/**
 * Builds the personalized Daily Autonomous Coach guidance briefing.
 */
export async function getAutonomousCoachBrief(uid: string): Promise<AutonomousCoachBrief> {
  let contextString = 'No data logged.';

  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      const data = snap.data();
      contextString = `
User: ${data.name || 'Student'}
Readiness Rating: ${data.profileScore?.overall || 75}/100
Gaps list: ${(data.aiAnalysis?.missingSkills || []).map((s: any) => s.skill).join(', ') || 'Docker, Redis'}
Skills list: ${(data.unifiedProfile?.skills || []).join(', ')}
`;
    }
  } catch (error) {
    console.error('[Autonomous Coach] Error loading profile context:', error);
  }

  const prompt = `
You are the SkillSphere Autonomous AI Coach (Career GPS). Compile today's personalized daily action guidelines.
User context:
${contextString}

Output a JSON response that maps EXACTLY to the following schema. Do not add markdown:
{
  "todayPriorities": ["priority action 1", "priority action 2"],
  "recommendedCodingProblem": "problem details",
  "recommendedLearningModule": "learning link details",
  "recommendedProjectTask": "project milestone details",
  "recommendedCertification": "target certification modules details",
  "recommendedApplication": "job title at company details",
  "careerHealthSummary": "A brief overview summary of their career health progress",
  "expectedScoreImprovement": "estimated score delta e.g. +3 points"
}
`;

  try {
    const res = await aiService.generateJSON<AutonomousCoachBrief>(
      prompt,
      DEFAULT_COACH_BRIEF,
      'You are a career coach. Output strictly valid JSON matching the requested structure.'
    );
    return res.data;
  } catch (error) {
    console.error('[Autonomous Coach] AI daily planner call failed:', error);
    return DEFAULT_COACH_BRIEF;
  }
}
