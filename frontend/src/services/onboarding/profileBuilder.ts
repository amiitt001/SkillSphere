import { UnifiedUserProfile, UnifiedProfileFieldMetadata } from './profileMemory';
import { profileService } from '@/services/profile/profileService';
import { profileCompleteness } from './profileCompleteness';
import { confidenceEngine } from './confidenceEngine';
import { logger } from '@/services/logger';

export const profileBuilder = {
  /**
   * Initializes a new profile or merges imported data into an existing profile document.
   */
  async buildAndSave(
    uid: string,
    inputs: {
      personalInfo?: Partial<UnifiedUserProfile['personalInfo']>;
      education?: UnifiedUserProfile['education'];
      skills?: string[];
      projects?: UnifiedUserProfile['projects'];
      experience?: UnifiedUserProfile['experience'];
      careerGoals?: Partial<UnifiedUserProfile['careerGoals']>;
      source: 'resume' | 'github' | 'leetcode' | 'codeforces' | 'user' | string;
      confidenceScores?: Record<string, number>;
    }
  ): Promise<UnifiedUserProfile | null> {
    try {
      const existing = await profileService.getUnifiedProfile(uid);

      // 1. Build personalInfo
      const newPersonalInfo = {
        fullName: inputs.personalInfo?.fullName || existing?.personalInfo?.fullName || '',
        email: inputs.personalInfo?.email || existing?.personalInfo?.email || '',
        githubUrl: inputs.personalInfo?.githubUrl || existing?.personalInfo?.githubUrl || undefined,
        linkedinUrl: inputs.personalInfo?.linkedinUrl || existing?.personalInfo?.linkedinUrl || undefined,
        leetcodeUsername: inputs.personalInfo?.leetcodeUsername || existing?.personalInfo?.leetcodeUsername || undefined,
        codeforcesHandle: inputs.personalInfo?.codeforcesHandle || existing?.personalInfo?.codeforcesHandle || undefined,
        location: inputs.personalInfo?.location || existing?.personalInfo?.location || undefined,
      };

      // 2. Build skills (union of current & new)
      const mergedSkills = Array.from(new Set([
        ...(existing?.skills || []),
        ...(inputs.skills || [])
      ])).filter(Boolean);

      // 3. Merge education, projects, experience
      const mergedEducation = inputs.education ?? existing?.education ?? [];
      const mergedProjects = inputs.projects ?? existing?.projects ?? [];
      const mergedExperience = inputs.experience ?? existing?.experience ?? [];

      // 4. Merge goals
      const mergedGoals = {
        preferredRoles: inputs.careerGoals?.preferredRoles ?? existing?.careerGoals?.preferredRoles ?? [],
        preferredIndustries: inputs.careerGoals?.preferredIndustries ?? existing?.careerGoals?.preferredIndustries ?? [],
        preferredLocations: inputs.careerGoals?.preferredLocations ?? existing?.careerGoals?.preferredLocations ?? [],
        expectedSalary: inputs.careerGoals?.expectedSalary ?? existing?.careerGoals?.expectedSalary ?? undefined,
        semester: inputs.careerGoals?.semester ?? existing?.careerGoals?.semester ?? undefined,
      };

      // 5. Update confidenceMetadata
      const newConfidenceMeta: Record<string, UnifiedProfileFieldMetadata> = {
        ...(existing?.confidenceMetadata || {})
      };

      // For fields explicitly provided in this input
      const source = inputs.source;
      const scores = inputs.confidenceScores || {};

      if (inputs.personalInfo) {
        Object.keys(inputs.personalInfo).forEach((field) => {
          const confidence = scores[`personalInfo.${field}`] ?? (source === 'user' ? 1.0 : 0.85);
          newConfidenceMeta[`personalInfo.${field}`] = confidenceEngine.createMetadata(source, confidence);
        });
      }
      if (inputs.education) {
        const confidence = scores['education'] ?? (source === 'user' ? 1.0 : 0.85);
        newConfidenceMeta['education'] = confidenceEngine.createMetadata(source, confidence);
      }
      if (inputs.skills) {
        const confidence = scores['skills'] ?? (source === 'user' ? 1.0 : 0.85);
        newConfidenceMeta['skills'] = confidenceEngine.createMetadata(source, confidence);
      }
      if (inputs.projects) {
        const confidence = scores['projects'] ?? (source === 'user' ? 1.0 : 0.85);
        newConfidenceMeta['projects'] = confidenceEngine.createMetadata(source, confidence);
      }
      if (inputs.experience) {
        const confidence = scores['experience'] ?? (source === 'user' ? 1.0 : 0.85);
        newConfidenceMeta['experience'] = confidenceEngine.createMetadata(source, confidence);
      }
      if (inputs.careerGoals) {
        Object.keys(inputs.careerGoals).forEach((field) => {
          const confidence = scores[`careerGoals.${field}`] ?? (source === 'user' ? 1.0 : 0.90);
          newConfidenceMeta[`careerGoals.${field}`] = confidenceEngine.createMetadata(source, confidence);
        });
      }

      // Draft profile template for completeness score check
      const draftProfile: UnifiedUserProfile = {
        uid,
        personalInfo: newPersonalInfo,
        education: mergedEducation,
        skills: mergedSkills,
        projects: mergedProjects,
        experience: mergedExperience,
        careerGoals: mergedGoals,
        profileCompleteness: 0,
        confidenceMetadata: newConfidenceMeta,
        lastUpdated: new Date().toISOString(),
      };

      // 6. Recalculate completeness
      const completeness = profileCompleteness.calculate(draftProfile);
      draftProfile.profileCompleteness = completeness.score;

      // 7. Save to database — throws on error so the API surface the real message
      return await profileService.saveUnifiedProfile(uid, draftProfile);
    } catch (error) {
      logger.error(`[ProfileBuilder] Failed to build profile for ${uid}:`, error);
      throw error;
    }
  }
};
