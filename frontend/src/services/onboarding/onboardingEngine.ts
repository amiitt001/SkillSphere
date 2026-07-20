import { resumeParser, ParsedResumeDraft } from './resumeParser';
import { profileBuilder } from './profileBuilder';
import { UnifiedUserProfile } from './profileMemory';
import { profileService } from '@/services/profile/profileService';
import { smartQuestionEngine, SmartQuestion } from './smartQuestionEngine';
import { profileCompleteness } from './profileCompleteness';
import { logger } from '@/services/logger';
import { resumeIntelligenceBuilder } from '@/services/resume-intelligence';

export const onboardingEngine = {
  /**
   * Parses an uploaded resume file and returns a structured JSON draft.
   */
  async processResumeUpload(buffer: Buffer, mimeType: string): Promise<{ draft: ParsedResumeDraft; text: string }> {
    logger.info(`[OnboardingEngine] Processing resume buffer upload with type: ${mimeType}`);
    const text = await resumeParser.extractText(buffer, mimeType);
    if (!text.trim()) {
      throw new Error('No readable text found in the resume document.');
    }
    const draft = await resumeParser.parseResumeText(text);
    return { draft, text };
  },

  /**
   * Commits the user-approved resume draft to the permanent Unified User Profile.
   */
  async saveApprovedDraft(uid: string, draft: ParsedResumeDraft): Promise<UnifiedUserProfile | null> {
    logger.info(`[OnboardingEngine] Committing approved resume draft for user: ${uid}`);
    
    // Construct rich UnifiedCareerProfile from the approved draft (reflects user manual edits)
    const careerProfile = await resumeIntelligenceBuilder.buildProfileFromDraft(uid, draft);
    
    // Commit the profile to Firestore (saves version log, hashes, enrichment features, and legacy fields)
    const savedProfile = await resumeIntelligenceBuilder.commitApprovedProfile(uid, careerProfile);
    
    return savedProfile as unknown as UnifiedUserProfile;
  },

  /**
   * Retrieves the current profile completeness status and next smart question for the user.
   */
  async getStatusAndQuestion(uid: string): Promise<{
    score: number;
    completed: string[];
    missing: string[];
    nextQuestion: SmartQuestion | null;
  }> {
    const profile = await profileService.getUnifiedProfile(uid);
    const completeness = profileCompleteness.calculate(profile);
    const nextQuestion = smartQuestionEngine.getNextQuestion(profile);

    return {
      score: completeness.score,
      completed: completeness.completed,
      missing: completeness.missing,
      nextQuestion
    };
  },

  /**
   * Saves a single field answer from the smart question widget.
   */
  async saveQuestionAnswer(uid: string, field: string, value: any): Promise<UnifiedUserProfile | null> {
    logger.info(`[OnboardingEngine] Saving smart question answer for ${uid} [${field}]:`, value);

    const inputData: any = {
      source: 'user'
    };

    const parts = field.split('.');
    if (parts.length === 2) {
      const [parent, child] = parts;
      inputData[parent] = {
        [child]: value
      };
    } else {
      inputData[field] = value;
    }

    return await profileBuilder.buildAndSave(uid, inputData);
  }
};
