import { getFirestore } from 'firebase-admin/firestore';
import '@/lib/firebaseAdmin';
import { UnifiedUserProfile } from '@/types/profile';
import { rankingEngine, RankableContext } from './rankingEngine';
import { budgetManager } from './budgetManager';
import { memoryManager } from './memoryManager';
import { logger } from '@/services/logger';

function getAdminDb() {
  return getFirestore();
}

export const contextEngine = {
  /**
   * Retrieves UnifiedUserProfile doc from Firestore.
   */
  async getProfile(uid: string): Promise<UnifiedUserProfile | null> {
    try {
      const snap = await getAdminDb().collection('users').doc(uid).get();
      if (snap.exists) {
        const data = snap.data();
        if (data?.unifiedProfile) {
          return data.unifiedProfile as UnifiedUserProfile;
        }
      }
      return null;
    } catch (err) {
      logger.error(`[ContextEngine] Error getting profile for ${uid}:`, err);
      return null;
    }
  },

  /**
   * Resolves the intent, checks for missing/low-confidence required fields,
   * ranks relevant context data points, and optimizes the context text length within the token budget.
   */
  async buildContext(uid: string, intent: string, maxTokens = 4000): Promise<{
    contextText: string;
    missingFields?: string[];
  }> {
    const profile = await this.getProfile(uid);
    if (!profile) {
      return { contextText: '', missingFields: ['personalInfo.fullName'] };
    }

    // 1. Map Intent to required fields list
    const requiredFields: string[] = [];
    if (intent === 'career_recommendations') {
      requiredFields.push('personalInfo.fullName', 'careerGoals.preferredRoles', 'education');
    } else if (intent === 'resume_analysis') {
      requiredFields.push('personalInfo.fullName', 'education', 'skills', 'projects');
    } else if (intent === 'mock_interview') {
      requiredFields.push('personalInfo.fullName', 'skills', 'careerGoals.preferredRoles');
    }

    // 2. Identify missing or low-confidence fields (confidence < 0.70)
    const missingFields: string[] = [];
    requiredFields.forEach((field) => {
      if (field === 'personalInfo.fullName') {
        const item = profile.personalInfo?.fullName;
        if (!item?.value || item.meta.confidence < 0.7) missingFields.push(field);
      } else if (field === 'careerGoals.preferredRoles') {
        const item = profile.careerGoals?.preferredRoles;
        if (!item?.value || item.value.length === 0 || item.meta.confidence < 0.7) {
          missingFields.push(field);
        }
      } else if (field === 'education') {
        if (!profile.education || profile.education.length === 0 || !profile.education[0].institution) {
          missingFields.push(field);
        }
      } else if (field === 'skills') {
        if (!profile.skills || profile.skills.length === 0) {
          missingFields.push(field);
        }
      } else if (field === 'projects') {
        if (!profile.projects || profile.projects.length === 0 || !profile.projects[0].title) {
          missingFields.push(field);
        }
      }
    });

    if (missingFields.length > 0) {
      logger.warn(`[ContextEngine] Gaps in required fields for intent ${intent}:`, missingFields);
      return { contextText: '', missingFields };
    }

    // 3. Assemble Rankable Context
    const contexts: RankableContext[] = [];
    const lastUpdated = profile.lastSyncAt || new Date().toISOString();

    if (profile.personalInfo?.fullName?.value) {
      contexts.push({
        text: `User: ${profile.personalInfo.fullName.value}. Location: ${profile.personalInfo.location?.value || 'India'}. Bio: ${profile.personalInfo.bio?.value || 'Developer'}.`,
        importance: 10,
        timestamp: profile.personalInfo.fullName.meta.timestamp || lastUpdated,
        confidence: profile.personalInfo.fullName.meta.confidence,
      });
    }

    if (profile.education) {
      profile.education.forEach((edu, idx) => {
        contexts.push({
          text: `Education details: Institution: ${edu.institution}, Degree: ${edu.degree}, stream: ${edu.stream}, graduation year: ${edu.graduationYear || 'N/A'}.`,
          importance: 8,
          timestamp: edu.meta.timestamp || lastUpdated,
          confidence: edu.meta.confidence,
        });
      });
    }

    if (profile.skills) {
      const skillsList = profile.skills.map((s) => `${s.name} (${s.experienceLevel})`).join(', ');
      contexts.push({
        text: `Primary Technical Skills: ${skillsList}.`,
        importance: 9,
        timestamp: lastUpdated,
        confidence: 0.95,
      });
    }

    if (profile.projects) {
      profile.projects.forEach((proj, idx) => {
        contexts.push({
          text: `Completed Project: Title: ${proj.title}. Description: ${proj.description}. Technologies used: ${proj.technologies.join(', ')}.`,
          importance: 7,
          timestamp: proj.meta.timestamp || lastUpdated,
          confidence: proj.meta.confidence,
        });
      });
    }

    if (profile.experience) {
      profile.experience.forEach((exp, idx) => {
        contexts.push({
          text: `Experience history: Company: ${exp.company}, role: ${exp.role}, duration: ${exp.duration}. details: ${exp.description || 'None'}.`,
          importance: 7,
          timestamp: exp.meta.timestamp || lastUpdated,
          confidence: exp.meta.confidence,
        });
      });
    }

    if (profile.careerGoals?.preferredRoles?.value) {
      contexts.push({
        text: `Target Career Path: Roles: ${profile.careerGoals.preferredRoles.value.join(', ')}. Industries: ${profile.careerGoals.preferredIndustries?.value?.join(', ') || 'Any'}. Locations: ${profile.careerGoals.preferredLocations?.value?.join(', ') || 'Any'}.`,
        importance: 9,
        timestamp: profile.careerGoals.preferredRoles.meta.timestamp || lastUpdated,
        confidence: profile.careerGoals.preferredRoles.meta.confidence,
      });
    }

    // Load recent conversation highlights
    const convMemory = await memoryManager.getMemory(uid, 'conversation');
    if (convMemory?.recentSummary) {
      contexts.push({
        text: `Past context/conversation summary: ${convMemory.recentSummary}`,
        importance: 6,
        timestamp: convMemory.updatedAt || lastUpdated,
        confidence: 0.90,
      });
    }

    // 4. Rank and slice context within maximum token budget limit
    const ranked = rankingEngine.rank(contexts);
    const optimized = budgetManager.optimizeContext(ranked, {
      maxContextTokens: maxTokens,
      reservedResponseTokens: 1000,
    });

    return {
      contextText: optimized.join('\n'),
    };
  }
};

export default contextEngine;
