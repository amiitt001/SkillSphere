import type { UnifiedProfile, AIProfileAnalysis } from '@/types';
import type { Internship, InternshipRecommendation } from './types';

/**
 * Computes an internship recommendation with matching metrics and tiering.
 */
export function matchInternship(
  internship: Internship,
  profile: UnifiedProfile,
  aiAnalysis: AIProfileAnalysis | null
): Omit<InternshipRecommendation, 'scores' | 'eligibility'> {
  const userSkillsLower = new Set(profile.skills.map((s) => s.toLowerCase()));
  profile.programmingLanguages.forEach((l) => userSkillsLower.add(l.name.toLowerCase()));
  profile.frameworks.forEach((f) => userSkillsLower.add(f.toLowerCase()));
  if (profile.linkedin?.skills) {
    profile.linkedin.skills.forEach((s) => userSkillsLower.add(s.toLowerCase()));
  }

  const strongSkills: string[] = [];
  const missingSkills: string[] = [];

  internship.skillsRequired.forEach((skill) => {
    if (userSkillsLower.has(skill.toLowerCase())) {
      strongSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  const totalSkillsCount = internship.skillsRequired.length;
  const matchedSkillsCount = strongSkills.length;
  const matchPercentage = totalSkillsCount > 0 
    ? Math.round((matchedSkillsCount / totalSkillsCount) * 100) 
    : 100;

  // Tiering classification: 'Easy Win' | 'Stretch' | 'Dream'
  let tier: 'Easy Win' | 'Stretch' | 'Dream' = 'Stretch';

  // Extract stipend value
  const stipendNum = parseInt(internship.stipend.replace(/[^0-9]/g, '')) || 0;

  if (matchPercentage >= 75 && stipendNum < 25000) {
    tier = 'Easy Win';
  } else if (matchPercentage < 50 || stipendNum >= 35000) {
    tier = 'Dream';
  } else {
    tier = 'Stretch';
  }

  return {
    ...internship,
    matchPercentage,
    strongSkills,
    missingSkills,
    tier
  };
}

export function recommendInternships(
  internships: Internship[],
  profile: UnifiedProfile,
  aiAnalysis: AIProfileAnalysis | null
): Omit<InternshipRecommendation, 'scores' | 'eligibility'>[] {
  return internships.map((internship) => matchInternship(internship, profile, aiAnalysis));
}
