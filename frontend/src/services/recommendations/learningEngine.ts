import type { UnifiedProfile, AIProfileAnalysis } from '@/types';
import type { Course, LearningRecommendation } from './types';

/**
 * Recommends courses based on missing skills and AI analysis of skill gaps.
 */
export function matchCourse(
  course: Course,
  profile: UnifiedProfile,
  aiAnalysis: AIProfileAnalysis | null
): Omit<LearningRecommendation, 'scores' | 'eligibility'> {
  const userSkillsLower = new Set(profile.skills.map((s) => s.toLowerCase()));
  profile.programmingLanguages.forEach((l) => userSkillsLower.add(l.name.toLowerCase()));
  profile.frameworks.forEach((f) => userSkillsLower.add(f.toLowerCase()));
  if (profile.linkedin?.skills) {
    profile.linkedin.skills.forEach((s) => userSkillsLower.add(s.toLowerCase()));
  }

  // Get missing skills identified by AI or computed from user profile
  const aiMissingSkills = new Set((aiAnalysis?.missingSkills || []).map((ms) => ms.skill.toLowerCase()));

  // Check how many of the skills gained from this course are missing for the user
  const courseGainedGaps: string[] = [];
  course.skillsGained.forEach((skill) => {
    if (!userSkillsLower.has(skill.toLowerCase())) {
      courseGainedGaps.push(skill);
    }
  });

  const isClosingAiGap = courseGainedGaps.some((skill) => aiMissingSkills.has(skill.toLowerCase()));

  let whyRecommended = `Builds core proficiency in ${course.skillsGained.join(', ')}.`;
  let expectedImpact = 'Medium';

  if (courseGainedGaps.length > 0) {
    whyRecommended = `Teaches key missing skills: ${courseGainedGaps.slice(0, 2).join(', ')}.`;
    expectedImpact = 'High';
  }

  if (isClosingAiGap) {
    whyRecommended = `Directly closes high-priority gaps in ${courseGainedGaps.filter(s => aiMissingSkills.has(s.toLowerCase())).join(', ')} identified by AI.`;
    expectedImpact = 'Critical';
  }

  // If user has all skills, it is a refresher course
  if (courseGainedGaps.length === 0) {
    whyRecommended = `Strengthens your existing foundations in ${course.skillsGained.join(', ')}.`;
    expectedImpact = 'Low';
  }

  return {
    ...course,
    whyRecommended,
    expectedImpact
  };
}

export function recommendCourses(
  courses: Course[],
  profile: UnifiedProfile,
  aiAnalysis: AIProfileAnalysis | null
): Omit<LearningRecommendation, 'scores' | 'eligibility'>[] {
  return courses.map((course) => matchCourse(course, profile, aiAnalysis));
}
