import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { getFirestore } from 'firebase-admin/firestore';
import '@/lib/firebaseAdmin';
import { aiService } from '@/services/ai/aiService';
import { logger } from '@/services/logger';
import { successResponse, errorResponse } from '@/utils';

export const dynamic = 'force-dynamic';

interface SwitchImpactResponse {
  transferableSkills: string[];
  retainedMilestones: string[];
  newGaps: string[];
  estimatedTimelineChange: string;
  impactSummary: string;
}

const DEFAULT_IMPACT: SwitchImpactResponse = {
  transferableSkills: [],
  retainedMilestones: [],
  newGaps: [],
  estimatedTimelineChange: 'Unknown change',
  impactSummary: 'No active profile found to evaluate transition deltas.'
};

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);

  try {
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      return errorResponse(authResult.error, authResult.status || 401);
    }

    const uid = authResult.user!.uid;
    const { newCareerTitle } = await request.json();

    if (!newCareerTitle) {
      return errorResponse('newCareerTitle is required.', 400);
    }

    const db = getFirestore();
    const userDocRef = db.collection('users').doc(uid);
    const userSnap = await userDocRef.get();

    if (!userSnap.exists) {
      return errorResponse('User profile not found.', 404);
    }

    const userData = userSnap.data() || {};
    const profile = userData.unifiedProfile || {};
    const currentGoal = userData.primaryCareerGoal || 'No active career committed';
    
    // Parse current skills
    const skillsList = (profile.skills || []).map((s: any) => typeof s === 'string' ? s : s.name);

    const prompt = `
You are the SkillSphere Career Switch Impact Analyzer. Evaluate the transition path from the user's current career goal to their newly targeted career goal.

Current Career Goal: "${currentGoal}"
New Target Career Goal: "${newCareerTitle}"
User Verified Skills: ${skillsList.join(', ')}

Perform a gap overlap analysis and return a JSON object conforming exactly to this schema:
{
  "transferableSkills": ["Skill A", "Skill B"],
  "retainedMilestones": ["Verified skill milestone 1 completed", "Core language mastery preserved"],
  "newGaps": ["Required Tech X", "Niche Skill Y"],
  "estimatedTimelineChange": "+2 Months" (or "-1 Month" or "No Change"),
  "impactSummary": "A concise paragraph summarizing transition difficulty, transferable synergy, and priority learning focuses."
}
`;

    const aiResponse = await aiService.generateJSON<SwitchImpactResponse>(
      prompt,
      DEFAULT_IMPACT,
      'You are a career change advisor. Output strictly valid JSON matching the requested SwitchImpactResponse schema.'
    );

    logger.info(`[Switch Impact API] [ReqId: ${requestId}] Computed transition from ${currentGoal} to ${newCareerTitle}`);
    return successResponse({ success: true, impact: aiResponse.data });
  } catch (error: any) {
    logger.error(`[Switch Impact API] [ReqId: ${requestId}] Error:`, error);
    return errorResponse(error.message || 'Error analyzing switching impact.', 500);
  }
}
