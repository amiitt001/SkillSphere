import type { UnifiedProfile, AIProfileAnalysis } from '@/types';
import type { Job, JobRecommendation } from './types';

/**
 * Computes a detailed job recommendation score and metadata for a user.
 */
export function matchJob(
  job: Job,
  profile: UnifiedProfile,
  aiAnalysis: AIProfileAnalysis | null
): Omit<JobRecommendation, 'scores' | 'eligibility'> {
  const userSkillsLower = new Set(profile.skills.map((s) => s.toLowerCase()));
  
  // Also parse programming languages and frameworks into user skills
  profile.programmingLanguages.forEach((l) => userSkillsLower.add(l.name.toLowerCase()));
  profile.frameworks.forEach((f) => userSkillsLower.add(f.toLowerCase()));
  if (profile.linkedin?.skills) {
    profile.linkedin.skills.forEach((s) => userSkillsLower.add(s.toLowerCase()));
  }

  const strongSkills: string[] = [];
  const missingSkills: string[] = [];

  job.skillsRequired.forEach((skill) => {
    if (userSkillsLower.has(skill.toLowerCase())) {
      strongSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  // Calculate Match Percentage
  const totalSkillsCount = job.skillsRequired.length;
  const matchedSkillsCount = strongSkills.length;
  let matchPercentage = totalSkillsCount > 0 
    ? Math.round((matchedSkillsCount / totalSkillsCount) * 100) 
    : 100;

  // Boost match percentage if this title aligns with user's AI career matches
  if (aiAnalysis?.careerMatches) {
    const isMatchedCareer = aiAnalysis.careerMatches.some(
      (m) => m.title.toLowerCase().includes(job.title.toLowerCase()) || 
             job.title.toLowerCase().includes(m.title.toLowerCase())
    );
    if (isMatchedCareer) {
      matchPercentage = Math.min(100, matchPercentage + 15);
    }
  }

  // Resume Compatibility: Based on skill match and Github repo projects overlap
  let resumeCompatibility = matchPercentage;
  if (profile.github?.repos) {
    const repoKeywords = profile.github.repos.flatMap((r) => [
      r.name.toLowerCase(),
      (r.description || '').toLowerCase()
    ]);
    const jobKeywords = [job.title, job.description, ...job.skillsRequired].map((k) => k.toLowerCase());
    
    let overlaps = 0;
    jobKeywords.forEach((kw) => {
      if (repoKeywords.some((rk) => rk.includes(kw))) {
        overlaps++;
      }
    });

    if (overlaps > 0) {
      resumeCompatibility = Math.min(100, resumeCompatibility + Math.min(20, overlaps * 5));
    }
  }

  // Experience Compatibility
  // Try to estimate user's experience based on LinkedIn details or academic year
  let userExperienceYears = 0;
  if (profile.linkedin?.currentRole) {
    // If not a student or has a role, estimate 2 years
    userExperienceYears = 2;
  }
  
  let experienceCompatibility = 100;
  const expDiff = userExperienceYears - job.experienceRequired;
  if (expDiff >= 0) {
    experienceCompatibility = 100;
  } else if (expDiff === -1) {
    experienceCompatibility = 70; // 1 year under
  } else if (expDiff === -2) {
    experienceCompatibility = 40; // 2 years under
  } else {
    experienceCompatibility = 20; // severely under-experienced
  }

  // Location Compatibility
  let locationCompatibility = 40;
  if (job.type === 'Remote' || job.location.toLowerCase().includes('remote')) {
    locationCompatibility = 100;
  } else {
    const userLoc = (profile.location || 'India').toLowerCase();
    const jobLoc = job.location.toLowerCase();
    if (jobLoc.includes(userLoc) || userLoc.includes(jobLoc)) {
      locationCompatibility = 100;
    } else if (userLoc === 'india' && (jobLoc.includes('bengaluru') || jobLoc.includes('mumbai') || jobLoc.includes('pune') || jobLoc.includes('gurugram') || jobLoc.includes('india'))) {
      locationCompatibility = 80;
    }
  }

  return {
    ...job,
    matchPercentage,
    strongSkills,
    missingSkills,
    resumeCompatibility,
    experienceCompatibility,
    locationCompatibility
  };
}

export function recommendJobs(
  jobs: Job[],
  profile: UnifiedProfile,
  aiAnalysis: AIProfileAnalysis | null
): Omit<JobRecommendation, 'scores' | 'eligibility'>[] {
  return jobs.map((job) => matchJob(job, profile, aiAnalysis));
}
