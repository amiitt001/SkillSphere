import type { UnifiedProfile, AIProfileAnalysis } from '@/types';
import type { EligibilityStatus, Job, Internship, Course, Certification, ProjectTemplate } from './types';

/**
 * Checks user eligibility for job positions.
 */
export function checkJobEligibility(
  job: Job,
  missingSkills: string[],
  profile: UnifiedProfile
): EligibilityStatus {
  let userExperienceYears = 0;
  if (profile.linkedin?.currentRole) {
    userExperienceYears = 2; // default estimated exp for synced linkedin profiles
  }

  const expDiff = job.experienceRequired - userExperienceYears;
  
  if (expDiff > 1) {
    return {
      status: 'Not Eligible',
      reason: `Requires ${job.experienceRequired} years of experience, but your profile lists approximately ${userExperienceYears} years.`
    };
  }

  if (missingSkills.length > 3) {
    return {
      status: 'Not Eligible',
      reason: `Missing ${missingSkills.length} critical skills required for this role: ${missingSkills.slice(0, 3).join(', ')}.`
    };
  }

  if (missingSkills.length > 0 || expDiff > 0) {
    const skillList = missingSkills.length > 0 ? `learn ${missingSkills.slice(0, 2).join(', ')}` : '';
    const expText = expDiff > 0 ? `gain ${expDiff} more year of experience` : '';
    const junction = skillList && expText ? ' and ' : '';
    return {
      status: 'Nearly Eligible',
      reason: `You are close! You need to ${skillList}${junction}${expText}.`
    };
  }

  return {
    status: 'Eligible',
    reason: `Your skills and experience align perfectly with this role's requirements.`
  };
}

/**
 * Checks user eligibility for internship positions.
 */
export function checkInternshipEligibility(
  internship: Internship,
  missingSkills: string[],
  userYear: string
): EligibilityStatus {
  const isYearTargeted = internship.academicYearTarget.some(
    (y) => y.toLowerCase() === userYear.toLowerCase()
  );

  if (missingSkills.length > 3) {
    return {
      status: 'Not Eligible',
      reason: `Missing key skills: ${missingSkills.slice(0, 3).join(', ')}.`
    };
  }

  if (!isYearTargeted) {
    return {
      status: 'Nearly Eligible',
      reason: `Targeted for ${internship.academicYearTarget.join(', ')} students, but you are currently in ${userYear}.`
    };
  }

  if (missingSkills.length > 0) {
    return {
      status: 'Nearly Eligible',
      reason: `Targeted year matches, but you need to acquire: ${missingSkills.join(', ')}.`
    };
  }

  return {
    status: 'Eligible',
    reason: `Your academic stream and skill profile align with this internship.`
  };
}

/**
 * Checks eligibility for courses, certifications, and projects.
 */
export function checkGeneralEligibility(
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Entry' | 'Mid' | 'Senior',
  userSkillCount: number
): EligibilityStatus {
  if ((level === 'Advanced' || level === 'Senior') && userSkillCount < 5) {
    return {
      status: 'Nearly Eligible',
      reason: `This is an advanced track. We recommend completing foundational beginner projects/courses first.`
    };
  }

  return {
    status: 'Eligible',
    reason: `You qualify to start this track immediately.`
  };
}
