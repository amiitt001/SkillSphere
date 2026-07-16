import { aiService } from '../ai/aiService';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { CareerOutcomePrediction } from './types';

const DEFAULT_PREDICTIONS: CareerOutcomePrediction = {
  placementProbability: 82,
  interviewSuccessPct: 75,
  atsSuccessPct: 80,
  expectedSalaryBand: '₹8,00,000 - ₹12,00,000 LPA',
  riskLevel: 'medium',
  stagnationRiskScore: 35,
  readinessForecast30Days: 85,
  readinessForecast60Days: 90,
  readinessForecast90Days: 95,
  aiExplanation: 'Your strong NodeJS foundational knowledge and quiz ratings position you well. Connecting LeetCode and resolving critical caching system design gaps is the highest ROI action to push salary potential to the top tier.'
};

/**
 * Calculates deterministic predictions and queries the AI service to explain outcomes.
 */
export async function getCareerPredictions(uid: string): Promise<CareerOutcomePrediction> {
  let userScore = 70;
  let userName = 'Student';
  let targetRole = 'Software Engineer';
  let totalRepos = 0;
  let problemsSolved = 0;

  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      const data = snap.data();
      userName = data.name || data.fullName || 'Student';
      if (data.profileScore) userScore = data.profileScore.overall;
      if (data.unifiedProfile) {
        totalRepos = data.unifiedProfile.totalRepositories || 0;
        problemsSolved = data.unifiedProfile.codingProblemsSolved || 0;
        if (data.unifiedProfile.linkedin?.currentRole) {
          targetRole = data.unifiedProfile.linkedin.currentRole;
        }
      }
    }
  } catch (err) {
    console.error('[Prediction Engine] Error fetching profile details:', err);
  }

  // Deterministic math
  const calculatedPlacement = Math.min(95, Math.round(userScore + (totalRepos > 5 ? 5 : 0) + (problemsSolved > 50 ? 5 : 0)));
  const calculatedAts = Math.min(92, Math.round(userScore - 5 + (totalRepos > 3 ? 10 : 0)));
  const calculatedInterview = Math.min(90, Math.round(userScore * 0.8 + 15));
  const stagnationRisk = Math.max(5, 100 - calculatedPlacement);

  let salaryBand = '₹4,00,000 - ₹6,00,000 LPA';
  if (calculatedPlacement > 85) {
    salaryBand = '₹12,00,000 - ₹18,00,000 LPA';
  } else if (calculatedPlacement > 70) {
    salaryBand = '₹7,00,000 - ₹11,00,000 LPA';
  }

  const prompt = `
You are the SkillSphere Career Outcome Predictor. Calculate forecasting metrics for:
User: ${userName}
Target Role: ${targetRole}
Readiness Score: ${userScore}/100
GitHub Repos: ${totalRepos}
LeetCode Solved: ${problemsSolved}

Determine expected salary band, risk Level (low/medium/high), and write a concise 2-sentence AI explanation.
Output a JSON response that maps EXACTLY to this schema. Do not add markdown:
{
  "placementProbability": ${calculatedPlacement},
  "interviewSuccessPct": ${calculatedInterview},
  "atsSuccessPct": ${calculatedAts},
  "expectedSalaryBand": "${salaryBand}",
  "riskLevel": "${calculatedPlacement > 80 ? 'low' : calculatedPlacement > 60 ? 'medium' : 'high'}",
  "stagnationRiskScore": ${stagnationRisk},
  "readinessForecast30Days": ${Math.min(98, calculatedPlacement + 3)},
  "readinessForecast60Days": ${Math.min(98, calculatedPlacement + 6)},
  "readinessForecast90Days": ${Math.min(98, calculatedPlacement + 10)},
  "aiExplanation": "A brief explanation of how to increase their scores and what holding them back"
}
`;

  const fallback = {
    ...DEFAULT_PREDICTIONS,
    placementProbability: calculatedPlacement,
    atsSuccessPct: calculatedAts,
    interviewSuccessPct: calculatedInterview,
    expectedSalaryBand: salaryBand,
    stagnationRiskScore: stagnationRisk,
    riskLevel: (calculatedPlacement > 80 ? 'low' : calculatedPlacement > 60 ? 'medium' : 'high') as 'low' | 'medium' | 'high'
  };

  try {
    const res = await aiService.generateJSON<CareerOutcomePrediction>(
      prompt,
      fallback,
      'You are a career forecasting advisor. Output strictly valid JSON matching the requested structure.'
    );
    return res.data;
  } catch (error) {
    console.error('[Prediction Engine] Error predicting outcomes:', error);
    return fallback;
  }
}
