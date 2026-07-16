import { UnifiedUserProfile } from './profileMemory';

export interface CompletenessResult {
  score: number;
  completed: string[];
  missing: string[];
}

export const profileCompleteness = {
  /**
   * Calculates user profile completeness percentage score and checklists.
   */
  calculate(profile: UnifiedUserProfile | null | undefined): CompletenessResult {
    const completed: string[] = [];
    const missing: string[] = [];
    let score = 0;

    if (!profile) {
      return {
        score: 0,
        completed: [],
        missing: [
          'Personal Info',
          'Education History',
          'Technical Skills',
          'Projects History',
          'Professional Experience',
          'Career Goals',
          'Connected Accounts'
        ]
      };
    }

    // 1. Personal Info (15%)
    let personalScore = 0;
    if (profile.personalInfo?.fullName) personalScore += 5;
    if (profile.personalInfo?.email) personalScore += 5;
    if (profile.personalInfo?.githubUrl || profile.personalInfo?.linkedinUrl || profile.personalInfo?.location) personalScore += 5;

    score += personalScore;
    if (personalScore === 15) {
      completed.push('Personal Info');
    } else {
      missing.push('Personal Info');
    }

    // 2. Education (15%)
    if (profile.education && profile.education.length > 0 && profile.education[0].institution && profile.education[0].degree) {
      score += 15;
      completed.push('Education History');
    } else {
      missing.push('Education History');
    }

    // 3. Technical Skills (20%)
    if (profile.skills && profile.skills.length > 0) {
      score += 20;
      completed.push('Technical Skills');
    } else {
      missing.push('Technical Skills');
    }

    // 4. Projects (15%)
    if (profile.projects && profile.projects.length > 0 && profile.projects[0].title) {
      score += 15;
      completed.push('Projects History');
    } else {
      missing.push('Projects History');
    }

    // 5. Professional Experience (15%)
    if (profile.experience && profile.experience.length > 0) {
      score += 15;
      completed.push('Professional Experience');
    } else {
      missing.push('Professional Experience');
    }

    // 6. Career Goals (10%)
    let goalScore = 0;
    if (profile.careerGoals?.preferredRoles && profile.careerGoals.preferredRoles.length > 0) goalScore += 5;
    if (profile.careerGoals?.preferredLocations && profile.careerGoals.preferredLocations.length > 0) goalScore += 5;

    score += goalScore;
    if (goalScore === 10) {
      completed.push('Career Goals');
    } else {
      missing.push('Career Goals');
    }

    // 7. Connected Accounts (10%)
    if (profile.personalInfo?.githubUrl || profile.personalInfo?.leetcodeUsername || profile.personalInfo?.codeforcesHandle || profile.personalInfo?.linkedinUrl) {
      score += 10;
      completed.push('Connected Accounts');
    } else {
      missing.push('Connected Accounts');
    }

    return {
      score,
      completed,
      missing
    };
  }
};
