import { UnifiedUserProfile } from './profileMemory';
import { profileService } from '@/services/profile/profileService';

export const contextBuilder = {
  /**
   * Builds context for the Career AI Recommendations engine.
   */
  async getCareerAIContext(uid: string): Promise<{
    academicStream: string;
    skills: string[];
    interests: string[];
    preferredRoles: string[];
    preferredLocations: string[];
  } | null> {
    const profile = await profileService.getUnifiedProfile(uid);
    if (!profile) return null;

    const academicStream = profile.education?.[0]?.stream || 'Engineering / Tech';
    const skills = profile.skills || [];
    const interests = profile.careerGoals?.preferredIndustries || [];
    const preferredRoles = profile.careerGoals?.preferredRoles || [];
    const preferredLocations = profile.careerGoals?.preferredLocations || [];

    return {
      academicStream,
      skills,
      interests,
      preferredRoles,
      preferredLocations
    };
  },

  /**
   * Builds context for the Resume AI bullet analyzer.
   */
  async getResumeAIContext(uid: string): Promise<{
    fullName: string;
    skills: string[];
    projects: UnifiedUserProfile['projects'];
    experience: UnifiedUserProfile['experience'];
    education: UnifiedUserProfile['education'];
  } | null> {
    const profile = await profileService.getUnifiedProfile(uid);
    if (!profile) return null;

    return {
      fullName: profile.personalInfo?.fullName || '',
      skills: profile.skills || [],
      projects: profile.projects || [],
      experience: profile.experience || [],
      education: profile.education || []
    };
  },

  /**
   * Builds context for the Mock Interview AI.
   */
  async getInterviewAIContext(uid: string): Promise<{
    targetRole: string;
    skills: string[];
  } | null> {
    const profile = await profileService.getUnifiedProfile(uid);
    if (!profile) return null;

    const targetRole = profile.careerGoals?.preferredRoles?.[0] || 'Software Engineer';
    const skills = profile.skills || [];

    return {
      targetRole,
      skills
    };
  },

  /**
   * Builds context for the Chatbot AI Assistant.
   */
  async getChatbotAIContext(uid: string): Promise<string> {
    const profile = await profileService.getUnifiedProfile(uid);
    if (!profile) return 'User has not completed onboarding yet.';

    const goals = profile.careerGoals?.preferredRoles?.join(', ') || 'Not specified';
    const location = profile.personalInfo?.location || 'Not specified';
    const skills = profile.skills?.join(', ') || 'None listed';
    const school = profile.education?.[0]?.institution || 'Not listed';
    const degree = profile.education?.[0]?.degree || 'Not listed';

    return `
User Profile Summary:
- Name: ${profile.personalInfo?.fullName}
- School: ${school} (${degree})
- Location: ${location}
- Primary Skills: ${skills}
- Career Goals: Targeting ${goals}
- Completeness: ${profile.profileCompleteness}% complete
`;
  }
};
