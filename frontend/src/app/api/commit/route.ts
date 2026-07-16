import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { getFirestore } from 'firebase-admin/firestore';
import '@/lib/firebaseAdmin';
import { aiService } from '@/services/ai/aiService';
import { eventStore } from '@/services/knowledge/eventStore';
import { logger } from '@/services/logger';
import { successResponse, errorResponse } from '@/utils';
import { CareerBlueprint } from '@/types/profile';

export const dynamic = 'force-dynamic';

const DEFAULT_BLUEPRINT: CareerBlueprint = {
  careerHealth: {
    overallScore: 60,
    breakdown: {
      technicalSkills: 50,
      projectsQuality: 50,
      learningBreadth: 50,
      interviewReadiness: 40,
      resumeQuality: 60,
      portfolioGlow: 50,
      openSourceContrib: 30,
      applicationRates: 40
    }
  },
  skillGap: {
    readinessScore: 50,
    estimatedTime: '6 Months',
    currentSkills: [],
    missingSkills: [],
    aiInsight: 'Build your profile to get personalized gap insights.'
  },
  learningRoadmap: [
    {
      phase: 'Phase 1: Foundations',
      duration: '1-2 Months',
      topics: ['Core Programming Language', 'Development Tools'],
      resources: ['Official documentation', 'Introduction tutorials']
    }
  ],
  recommendedProjects: [
    {
      title: 'Starter Project',
      description: 'Build a basic application to understand core concepts.',
      difficulty: 'Beginner',
      technologies: ['Git']
    }
  ],
  certifications: [],
  resumeImprovements: ['Add more relevant project descriptions', 'Detail technical stack used in each experience'],
  githubImprovements: ['Create a clean README for your top project', 'Ensure consistent commit history'],
  interviewPlan: ['Practice basic questions', 'Review fundamental algorithms'],
  targetCompanies: ['General tech companies'],
  recommendedJobs: [],
  recommendedInternships: []
};

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);

  try {
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      return errorResponse(authResult.error, authResult.status || 401);
    }

    const uid = authResult.user!.uid;
    const { careerTitle } = await request.json();

    if (!careerTitle) {
      return errorResponse('careerTitle is required.', 400);
    }

    const db = getFirestore();
    const userDocRef = db.collection('users').doc(uid);
    const userSnap = await userDocRef.get();

    if (!userSnap.exists) {
      return errorResponse('User profile not found.', 404);
    }

    const userData = userSnap.data() || {};
    const profile = userData.unifiedProfile || {};
    const currentGoal = userData.primaryCareerGoal;
    
    // Parse current skills
    const skillsList = (profile.skills || []).map((s: any) => typeof s === 'string' ? s : s.name);
    const projectsList = (profile.projects || []).map((p: any) => `${p.title}: ${p.description}`).join('; ');
    const experienceList = (profile.experience || []).map((e: any) => `${e.role} at ${e.company}`).join('; ');

    const prompt = `
You are the SkillSphere Career Blueprint Generator. Create a highly personalized, structured Career Blueprint for a user targeting the career path: "${careerTitle}".

User Profile Details:
- Education: ${JSON.stringify(profile.education || [])}
- Skills: ${skillsList.join(', ')}
- Projects: ${projectsList}
- Experience: ${experienceList}

Construct a comprehensive and realistic Career Blueprint. Return a JSON response matching the following structure:
{
  "careerHealth": {
    "overallScore": 65,
    "breakdown": {
      "technicalSkills": 70,
      "projectsQuality": 60,
      "learningBreadth": 65,
      "interviewReadiness": 50,
      "resumeQuality": 70,
      "portfolioGlow": 60,
      "openSourceContrib": 40,
      "applicationRates": 50
    }
  },
  "skillGap": {
    "readinessScore": 65,
    "estimatedTime": "3-5 Months",
    "currentSkills": ["React", "CSS"],
    "missingSkills": [
      { "name": "Node.js", "priority": "high" },
      { "name": "System Design", "priority": "medium" }
    ],
    "aiInsight": "A paragraph explaining gap alignment."
  },
  "learningRoadmap": [
    {
      "phase": "Phase 1 Title",
      "duration": "1-2 Months",
      "topics": ["Topic A", "Topic B"],
      "resources": ["Resource 1", "Resource 2"]
    }
  ],
  "recommendedProjects": [
    {
      "title": "Project Title",
      "description": "Short details",
      "difficulty": "Intermediate",
      "technologies": ["React", "Express"]
    }
  ],
  "certifications": ["AWS Developer Associate", "Google Cloud Associate"],
  "resumeImprovements": ["Bullet point 1", "Bullet point 2"],
  "githubImprovements": ["README tips", "Contribution guides"],
  "interviewPlan": ["Topic 1 prep", "Topic 2 prep"],
  "targetCompanies": ["Company A", "Company B"],
  "recommendedJobs": ["Software Developer", "Fullstack Developer"],
  "recommendedInternships": ["Web Developer Intern"]
}
`;

    // Request JSON from Gemini
    const aiResponse = await aiService.generateJSON<CareerBlueprint>(
      prompt,
      DEFAULT_BLUEPRINT,
      'You are a career consultant. Return strictly a JSON response conforming to the exact CareerBlueprint schema.'
    );

    const blueprint = aiResponse.data;

    // Track previous careers history list
    const previousCareers = userData.previousCareers || [];
    if (currentGoal && currentGoal !== careerTitle && !previousCareers.includes(currentGoal)) {
      previousCareers.push(currentGoal);
    }

    // Save to Firestore root user document
    await userDocRef.set({
      primaryCareerGoal: careerTitle,
      careerBlueprint: blueprint,
      previousCareers,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Append to Event Store
    await eventStore.appendEvent(uid, 'CareerGoalChanged', {
      primaryCareerGoal: careerTitle,
      previousCareers
    }, 'user');

    logger.info(`[Commit API] [ReqId: ${requestId}] User committed to career: ${careerTitle}`);
    return successResponse({ success: true, primaryCareerGoal: careerTitle, blueprint });
  } catch (error: any) {
    logger.error(`[Commit API] [ReqId: ${requestId}] Error:`, error);
    return errorResponse(error.message || 'Error committing career goal.', 500);
  }
}
